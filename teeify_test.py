import unittest

import teeify

class TestBasics(unittest.TestCase):

  def setUp(self):
    self.maxDiff = 1001

  def testSimple(self):
    content = """
    a > 5
     => not b 
      => bob
        => action: one
        <= action: two
      <=
     <= c <= feature:delta
      =>
      <= action: three
    """
    trees = teeify.Parser(content).Parse()
    self.assertSetEqual(set(trees.keys()), {'untitled_0'})
    self.assertEqual(trees['untitled_0'],
    {'feature': 'a',
     'operation': '>',
     'threshold': '5',
     'right_child': {
        'feature': 'b',
        'operation': 'not',
        'right_child': {
            'feature': 'bob',
            'operation': 'is',
            'right_action': 'one',
            'left_action': 'two'}},
     'left_child': {
        'feature': 'c',
        'operation': '<=',
        'threshold_feature': 'delta',
        'left_action': 'three'}})

  def testName(self):
    content = """
    name:tree0
    a < 5
      => action: one
      <=
    
    beta >= 4
      => tree:tree0
      <=
    """
    trees = teeify.Parser(content).Parse()
    self.assertSetEqual(set(trees.keys()), {'tree0', 'untitled_0'})
    self.assertEqual(trees['untitled_0'],
        {'feature': 'beta',
         'threshold': '4',
         'operation': '>=',
         'right_child': {
            'feature': 'a',
            'operation': '<',
            'threshold': '5',
            'right_action': 'one'}})

  def testFillLeft(self):
    content = """
    name:tree0
    a
      => b
        => c
          => action: one
          <= 
        <=
      <= d
        => action: two
        <=

    name:left
    e
      =>
      <= action: three

    f
      => action: four
      <= fill_left tree:tree0 tree:left
    """
    trees = teeify.Parser(content).Parse()
    self.assertSetEqual(set(trees.keys()), 
        {'tree0', 'left', 'untitled_0', 'fill_left_tree0_left'})
    expected = {'feature' :'a', 'operation': 'is',
       'right_child': {
          'feature' : 'b', 'operation': 'is',
          'right_child': {
            'feature' : 'c', 'operation': 'is',
            'right_action': 'one',
            'left_child': {
              'feature': 'e',
              'operation': 'is',
              'left_action': 'three'}},
          'left_child': {
            'feature': 'e',
            'operation': 'is',
            'left_action': 'three'}},
        'left_child': {
          'feature': 'd',
          'operation': 'is',
          'right_action': 'two',
          'left_child':{
            'feature': 'e',
            'operation': 'is',
            'left_action': 'three'}}}
    self.assertEqual(trees['fill_left_tree0_left'], expected)

  def testTopLevelFillLeft(self):
    content = """
    name:tree0
    a 
      => action: one
      <=

    name:left
    b
      => action: two
      <=

    fill_left tree:tree0 tree:left
    """
    trees = teeify.Parser(content).Parse()
    self.assertSetEqual(set(trees.keys()), 
        {'tree0', 'left', 'untitled_0', 'fill_left_tree0_left'})
    self.assertEqual(trees['untitled_0'],
        {'feature': 'a',
         'operation': 'is',
         'right_action': 'one',
         'left_child': {
            'feature': 'b',
            'operation': 'is',
            'right_action': 'two'}})
       




if __name__ == '__main__':
  unittest.main()
