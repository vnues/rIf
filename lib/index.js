const t = require('@babel/types')

function getAttrASTAndIndexByName(node, attrName) {
  if (!node || !node.openingElement) { return null }
  const { type, attributes } = node.openingElement;
  if (type !== 'JSXOpeningElement') { return null }
  const index = attributes.findIndex(attr => attr.name && attr.name.name === attrName)
  if (index < 0) { return null }
  const atrrBindingAST = attributes[index]
  return {
    atrrBindingAST,
    index,
    node
  }
}
function findNextNode(path, siblings, index) {
  if (!siblings) {
    return null
  }
  const nextSiblingsPath = siblings[index + 1]
  if (!nextSiblingsPath) return null;
  const { type, value } = nextSiblingsPath
  if (type === 'JSXText' && !value.trim()) {
    return findNextNode(nextSiblingsPath, siblings, index + 1)
  }
  return type === 'JSXElement' ? nextSiblingsPath : null
}

function transformIfBinding(path, ifBinding) {
  const { atrrBindingAST, index, node } = ifBinding

  removeAttrASTByIndex(node, index)
  const targetAST = t.JSXExpressionContainer(t.ConditionalExpression(atrrBindingAST.value.expression, node, t.nullLiteral()))
  path.replaceWith(targetAST)
}
function removeAttrASTByIndex(node, index) {
  const { openingElement } = node
  if (!openingElement) { return }
  const { attributes } = openingElement
  attributes.splice(index, 1)
}
function removeNode(nodes, nodeRemoved) {

  const index = nodes.findIndex((item) => item === nodeRemoved)
  if (index >= 0) {
    nodes.splice(index, 1)
  }
}

function transformElseIfBindings(path, ifBinding, elseIfBindings, elseBinding) {
  const {
    atrrBindingAST: ifAttr,
    index: ifIndex,
    node: ifNode
  } = ifBinding
  removeAttrASTByIndex(ifNode, ifIndex)
  if (elseBinding) {
    const {
      node: elseNode,
      index: elseIndex,
    } = elseBinding
    removeAttrASTByIndex(elseNode, elseIndex);
  }
  elseIfBindings.forEach((binding) => {
    const { node, index } = binding
    removeAttrASTByIndex(node, index);

  })

  const targetAST = t.callExpression(t.arrowFunctionExpression([], t.blockStatement([
    t.ifStatement(
      ifAttr.value.expression,
      t.returnStatement(ifNode),
      getAlternteAST(elseIfBindings, elseBinding)
    )
  ])), [])
  path.replaceWith(targetAST)
}
function getAlternteAST(elseIfBindings, elseBinding, index = 0) {
  if (index + 1 < elseIfBindings.length) {
    const elseIfBinding = elseIfBindings[index];
    const {
      atrrBindingAST,
      node
    } = elseIfBinding;
    return t.ifStatement(
      atrrBindingAST.value.expression,
      t.returnStatement(node),
      getAlternteAST(elseIfBindings, elseBinding, index + 1)
    );
  }
  if (elseBinding) {
    return t.returnStatement(elseBinding.node);
  }
  return null;

}

function transformElseBinding(path, ifBinding, elseBinding) {
  const {
    atrrBindingAST: ifAttr,
    index: ifIndex,
    node: ifNode
  } = ifBinding;
  const {
    node: elseNode,
    index: elseIndex
  } = elseBinding;
  removeAttrASTByIndex(ifNode, ifIndex);
  removeAttrASTByIndex(elseNode, elseIndex);
  const targetAST = t.conditionalExpression(
    ifAttr.value.expression,
    ifNode,
    elseNode
  );
  path.replaceWith(targetAST);
}


module.exports = {
  getAttrASTAndIndexByName,
  transformIfBinding,
  findNextNode,
  removeNode,
  transformElseIfBindings,
  transformElseBinding
};
