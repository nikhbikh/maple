/**
 * Node
 *
 * Implements a node of a decision tree.
 */

var Node = function(params) {
    
  this.is_leaf = params.is_leaf;
  this.action = params.action;
  this.parent = params.parent;
  this.left_child = params.left_child;
  this.right_child = params.right_child;
  this.feature = params.feature;
  this.operation = params.operation;
  this.threshold = params.threshold;
  this.threshold_feature = params.threshold_feature;

}

Node.prototype.traverse = function(features) {
  if (this.action) {
    return this.action;
  }

  if (!this.feature) {
    return this.right_child;
  }

  var f = features[this.feature];
  if (f == undefined) {
    throw `Feature ${f} not available`;
  }

  var t = this.threshold;
  if (this.threshold_feature) {
    t = features[this.threshold_feature]
    if (t == undefined) {
      throw `Feature ${t} not available`;
    }
  }
  var right_return = this.right_child;
  var left_return = this.left_child;
  if (this.action) {
    right_return = this.action;
    left_return = null;
  }

  switch (this.operation) {
    case '==':
      if (f == t) {
        return right_return;
      }
      return left_return;
    case '>=':
      if (f >= t) {
        return right_return;
      }
      return left_return;
    case '<=':
      if (f <= t) {
        return right_return;
      }
      return left_return;
    case '>':
      if (f > t) {
        return right_return;
      }
      return left_return;
    case '<':
      if (f < t) {
        return right_return;
      }
      return left_return;
    case 'not':
      if (!f) {
        return right_return;
      }
      return left_return;
    case 'is':
      if (f) {
        return right_return;
      }
      return left_return;
  }
}


root1 = {'is_leaf': false,
         'feature': 'ca1c',
         'threshold': 6.5,
         'operation': '>=',
         'right_child': take_metformin}

take_metformin = {'is_leaf': false,
                  'feature': 'egfr',
                  'threshold': 30,
                  'operation': '>=',
                  'right_child': {'is_leaf': false,
                                  'feature': 'taking_met',
                                  'operation': 'not',
                                  'right_child': {'is_leaf': false,
                                                  'feature': 'side_effects_met',
                                                  'operation': 'not',
                                                  'right_child': {'is_leaf': true,
                                                                  'action': 'take metformin'}}}};
take_sulfonylurea = {'feature': 'contra_su',
                     'operation': 'not',
                     'right_child': {'action': 'take sulfonylurea'}

root2 = {'feature': 'ca1c',
         'threshold_feature': 'ta1c',
         'operation': '>',
         'right_child': {'feature': 'n_others',
                         'operation': '==',
                         'threshold': 0,
                         'right_child': start_first_drug},
         'left_child': {'feature': 'n_others',
                        'threshold': 1,
                        'right_child': start_second_drug},
                        'left_child': {'is_leaf': true,
                                       'action': 'Don\'t know how more than 2 drugs'}}

start_first_drug = {'right_child': add_oral,
                    'bubble_left_child': add_injectible}

add_oral = {'right_child': take_metformin,
            'bubble_left_child': take_sulfonylurea}

add_injectible = {'feature': 'risk',
                  'operation': '==',
                  'threshold': 'ascvd_risk',
                  'right_child': {'action': 'take GLP-1 RA with CVD benefits'},
                  'left_child': {'feature': 'risk',
                                 'operation': '==',
                                 'threshold': 'ckd_hf_risk',
                                 'right_child': {'feature': 'egfr',
                                                 'operation': '>=',
                                                 'threshold': 45,
                                                 'right_child': {'action': 'take SGLT2i with benefits'},
                                                 'left_child': {'action': 'take GLP-1 RA with CVD benefits'}
                                 'left_child': {'feature': 'goals2',  // risk == no_risk
                                                'threshold': 'hypo_goals2',
                                                'operation': '
                                 },

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
 

