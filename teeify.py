""" Parser for tree script language. 

Example:
name:take_metformin
egfr >= 30
  => not taking_met
    => not side_effects_met
      => action: take metformin
      <=
    <=
  <=

name:take_sulfonylurea
not contra_su
 => action: take_sulfonylurea
 <=

name:add_oral
fill_left tree:take_metformin tree:take_sulfonylurea

name:start_first_drug
fill_left tree:add_oral tree:add_injectible

name:start_second_drug
last_drug_time < 90
  => action: give drug 3 months before adding a second drug
  <= current_a1c > feature:target_a1c+1
    => fill_left tree:add_injectible tree:add_oral
    <= tree:add_oral

name:add_injectible
risk == ascvd_risk 
  => action: take GLP-1 RA with CVD benefits
  <= risk == ckd_hf_risk 
    => egfr >= 45 
      => action: take SGLT2i with benefits
      <= action: take GLP-1 RA with CVD benefits
    <= risk == no_risk 
      => goals2 == hypo_goals2
        => action: take GLP-1 RA
        <= goals2 == weight_goals2
          => action: take GLP-1 RA
          <= goals2 == none
            => action: take GLP-1 RA
            <= tree:take_metformin
      <=

name:root1
current_a1c >= 6.5
  => tree:take_metformin
  <=

name:root2
current_a1c > feature:target_a1c
  => n_drugs == 0
    => tree:start_first_drug
    <= n_drugs == 1
      => tree: start_second_drug
      <= action: Don't know how to add more than 2 drugs
  <=

"""
import collections
import copy
import functools
import itertools
import json
import sys


def IsLeaf(node):
  return (node is None 
          or 'action' in node 
          or len(node.keys()) == 1 
          or 'tree' in node 
          or 'fill_left' in node)

def IsFull(node):
  return 'right_child' in node and 'left_child' in node

class ParserError(Exception):
  def __init__(self, message, parser):
    new_message = (
        'Error at line {}: {}\n{}'
        ''.format(parser.line_no - 1, parser.line, message))
    super().__init__(new_message) 

class Parser(object):

  def __init__(self, content):
    self.lines = content.splitlines()
    self.o_lines = copy.deepcopy(self.lines)
    self.line = self.lines.pop(0)
    self.line_no = 1
    self.trees = {}

  def NextLine(self):
    if self.lines:
      self.line = self.lines.pop(0)
      self.line_no += 1
      return
    return None

  def CheckFeature(self, token):
    if not token[0].isalnum():
      raise ParserError('Malformed feature name: {}'.format(token), self)

  def CheckOp(self, token):
    if token not in ('== >= <= > <'.split()):
      raise ParserError('Unknown operation: {}'.format(token), self)

    
  def ParseNode(self):
    line = self.line.strip()
    self.NextLine()
    is_root = None
    node = None
    if line[:2] == '=>':
      line = line[2:].strip()
    elif line[:2] == '<=':
      line = line[2:].strip()
    else:
      is_root = True

    if not line and not is_root:
      return is_root, node

    if line.startswith('action:'):
      if is_root:
        raise ParserError('Root cannot be an action, I think', self)
      node = {'action': line[len('action:'):].strip()}
      return is_root, node

    if line.startswith('tree:'):
      tree_name = line[len('tree:'):].strip()
      node = {'tree': tree_name}
      return is_root, node

    tokens = line.split()
    if tokens[0] == 'not':
      if len(tokens) != 2:
        raise ParserError('Expecting exactly two tokens for line: {}'
                         ''.format(line), self)
      node = {'feature': tokens[1],
              'operation': 'not'}
      return is_root, node

    if tokens[0] == 'fill_left':
      if len(tokens) != 3:
        raise ParserError('Expecting exactly three tokens for line: {}'
                         ''.format(line), self)
      if not tokens[1].startswith('tree:') or not tokens[2].startswith('tree:'):
        raise ParserError('Can only fill with trees: {}'.format(line), self)
      main_tree = tokens[1][len('tree:'):].strip()
      tree_left = tokens[2][len('tree:'):].strip()
      node = {'main_tree': main_tree,
              'fill_left': tree_left}
      return is_root, node

    if len(tokens) == 1:
      self.CheckFeature(tokens[0])
      node = {'feature': tokens[0],
              'operation': 'is'}
      return is_root, node

    if len(tokens) != 3:
      raise ParserError('Malformed line: {}'.format(line), self)

    self.CheckFeature(tokens[0])
    self.CheckOp(tokens[1])
    node = {'feature': tokens[0],
            'operation': tokens[1]}

    if tokens[2].startswith('feature:'):
      threshold = tokens[2][len('feature:'):]
      self.CheckFeature(threshold)
      node['threshold_feature'] = threshold
      return is_root, node

    self.CheckFeature(tokens[2])
    node['threshold'] = tokens[2]
    return is_root, node

  def NextChild(self):
    is_root, node = self.ParseNode()
    if is_root:
      raise ParserError('Unexpected root at line: {}'.format(self.line), self)
    return node

  def ParseSubTree(self):
    node_stack = []  # only use append and pop
    is_root, root = self.ParseNode()
    if not is_root:
      raise ParserError('Expect first line to be a root', self)
    curr_node = root

    if IsLeaf(root):
      return root

    node = self.NextChild()

    while True:
      if IsLeaf(node) or IsFull(node):
        if 'right_child' not in curr_node:
          curr_node['right_child'] = node
          node = self.NextChild()
          continue
        else:
          curr_node['left_child'] = node
          if not node_stack:
            break
          node = curr_node
          curr_node = node_stack.pop()
          continue

      
      node_stack.append(curr_node)
      curr_node = node
      node = self.NextChild()
    PruneEmptyNodes(root)
    CollapseActions(root)

    return root

  def NextNonEmptyLine(self):
    while self.lines:
      if self.line.strip() == '':
        self.NextLine()
      else:
        break
    

  def Parse(self):
    try:
      self.NextNonEmptyLine()
      n_unnamed = 0
      current_tree_name = None
      while self.lines:
        if self.line.strip().startswith('name:'):
          current_tree_name = self.line.strip()[len('name:'):]
          self.NextLine()
        root = self.ParseSubTree()
        self.NextNonEmptyLine()
        if current_tree_name is None:
          current_tree_name = 'untitled_{}'.format(n_unnamed)
          n_unnamed += 1
        self.trees[current_tree_name] = root
        current_tree_name = None
      self.FillLeft()
      self.FillTrees()
      return self.trees
    except Exception as e:
      tb = sys.exc_info()[2]
      raise ParserError(e, self).with_traceback(tb)
    
  def FillTrees(self):
    class before(object):
      def __init__(self):
        self.required_trees = set()

      def __call__(self, node): 
        if 'tree' in node:
          self.required_trees.add(node['tree'])
     
    deps = {}
    all_deps = set()
    for name, tree in self.trees.items():
      b = before()
      DFS(tree, before=b)
      if b.required_trees.difference(self.trees.keys()):
        raise ValueError('Missing one of ({}) for tree {}'
                         ''.format(b.required_trees, name))
      deps[name] = b.required_trees

    def after(node, fill_trees):
      if 'tree' in node and node['tree'] in fill_trees:
        tree = node.pop('tree')
        node.update(self.trees[tree])
        
    while True:
      can_fill = set()
      for name, dep_trees in deps.items():
        if not dep_trees:
          can_fill.add(name)
      if not can_fill:
        raise ValueError('circular dependency')
      if len(can_fill) == len(deps):
        break
      for name, dep_trees in deps.items():
        if dep_trees.intersection(can_fill):
          DFS(self.trees[name],
              after=functools.partial(after, fill_trees=can_fill))
        deps[name] = dep_trees.difference(can_fill)

  def FillLeft(self):
    fill_lefts = {}

    # Figure out which fill_lefts there are and replace them with tree markers.
    def before(node):
      if 'fill_left' in node:
        main_tree = node.pop('main_tree')
        left = node.pop('fill_left')
        node['tree'] = 'fill_left_{}_{}'.format(main_tree, left)
        fill_lefts[main_tree] = left

    for name, root in self.trees.items():
      DFS(root, before=before)

    def after(node, fill_left):
      if 'left_child' not in node:
        node['left_child'] = fill_left
    
    for main_name, left_name in fill_lefts.items():
      main = self.trees[main_name]
      left = self.trees[left_name]
      main_copy = copy.deepcopy(main)
      DFS(main_copy, after=functools.partial(after, fill_left=left))
      self.trees['fill_left_{}_{}'.format(main_name, left_name)] = main_copy;
  

def DFS(root, before=None, after=None):
  before = before or (lambda x: None)
  after = after or (lambda x: None)
  node_stack = [root] # only use append and pop
  while node_stack:
    node = node_stack.pop()
    if IsLeaf(node):
      before(node)
      after(node)
      continue
    before(node)
    if 'right_child' in node:
      node_stack.append(node['right_child'])
    if 'left_child' in node:
      node_stack.append(node['left_child'])
    after(node)
  return root

def PruneEmptyNodes(root):
  def before(node):
    if 'right_child' in node and node['right_child'] is None:
      node.pop('right_child')
    if 'left_child' in node and node['left_child'] is None:
      node.pop('left_child')
  return DFS(root, before=before)

def CollapseActions(root):
  def before(node):
    if 'right_child' in node and 'action' in node['right_child']:
      node['right_action'] = node['right_child']['action']
      node.pop('right_child')
    if 'left_child' in node and 'action' in node['left_child']:
      node['left_action'] = node['left_child']['action']
      node.pop('left_child')
  return DFS(root, before=before)

if __name__ == '__main__':
  import argparse

  def main():
    parser = argparse.ArgumentParser(
        description='Convert tree from txt to json')
    parser.add_argument(
        '--input', dest='input_fl', required=True, type=str)
    parser.add_argument(
        '--output', dest='output_fl', default= './docs/trees.json',
        type=str)

    args = parser.parse_args()
    print(args.input_fl)
    print(args.output_fl)
    with open(args.input_fl, 'r') as f:
      content = f.read()
    trees = Parser(content).Parse()
    with open(args.output_fl, 'w') as f:
      json.dump(trees, f)

  main()
