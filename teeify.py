""" Parser for tree script language. 

Example:
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
            <=
      <=


risk == ascvd_risk 
  => action: take GLP-1 RA with CVD benefits
  <= 
"""

def CheckFeature(token):
  if not token[0].isalnum():
    raise ValueError('Malformed feature name: {}'.format(token))


def CheckOp(token):
  if token not in ('== >= <= > <'.split()):
    raise ValueError('Unknown operation: {}'.format(token))
    

def ParseLine(line):
  line = line.strip()
  is_root = None
  is_right_child = None
  node = None
  if line[:2] == '=>':
    is_right_child = True
    line = line[2:].strip()
  elif line[:2] == '<=':
    is_right_child = False
    line = line[2:].strip()
  else:
    is_root = True

  if not line:
    return is_root, is_right_child, node

  if line.startswith('action:'):
    if is_root:
      raise ValueError('Root cannot be an action, I think')
    node = {'action': line[len('action:'):].strip()}
    return is_root, is_right_child, node

  tokens = line.split()
  if tokens[0] == 'not':
    if len(tokens) != 2:
      raise ValueError('Expecting exactly two tokens for line: {}'
                       ''.format(line))
    node = {'feature': tokens[1],
            'operation': 'not'}
    return is_root, is_right_child, node

  if len(tokens) == 1:
    CheckFeature(tokens[0])
    node = {'feature': tokens[0],
            'operation': 'is'}
    return is_root, is_right_child, node

  if len(tokens) != 3:
    raise ValueError('Malformed line: {}'.format(line))

  CheckFeature(tokens[0])
  CheckOp(tokens[1])
  node = {'feature': tokens[0],
          'operation': tokens[1]}

  if tokens[2].startswith('feature:'):
    target = tokens[2][len('feature:')]
    CheckFeature(target)
    node['target_feature'] = target
    return is_root, is_right_child, node

  CheckFeature(tokens[2])
  node['target'] = tokens[2]
  return is_root, is_right_child, node

def IsLeaf(node):
  return node is None or 'action' in node or len(node.keys()) == 1

def IsFull(node):
  return 'right_child' in node and 'left_child' in node

def NextChild(lines):
  l = lines.pop(0)
  is_root, is_right_child, node = ParseLine(l)
  if is_root:
    raise ValueError('Unexpected root at line: {}'.format(l))
  return node

def Parse(content):
  node_stack = []  # only use append and pop
  lines = content.splitlines()
  is_root, _, root = ParseLine(lines.pop(0))
  if not is_root:
    raise ValueError('Expect first line to be a root')
  curr_node = root

  node = NextChild(lines)

  while True:
    if IsLeaf(node) or IsFull(node):
      if 'right_child' not in curr_node:
        curr_node['right_child'] = node
        node = NextChild(lines)
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
    node = NextChild(lines)

  return root

def PruneEmptyNodes(root):
  node_stack = []
  if IsLeaf(root):
    return
  node_stack.append(root)
  while node_stack:
    curr_node = node_stack.pop()
    if IsLeaf(curr_node):
      continue
    if curr_node['right_child'] is None:
      curr_node.pop('right_child')
    if curr_node['left_child'] is None:
      curr_node.pop('left_child')

    if 'right_child' in curr_node:
      node_stack.append(curr_node['right_child'])
    if 'left_child' in curr_node:
      node_stack.append(curr_node['left_child'])
    



    


  

    

