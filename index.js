const { getAttrASTAndIndexByName, transformIfBinding, findNextNode, removeNode, transformElseIfBindings, transformElseBinding } = require("./lib")

const defaultOpts = {
  ifAttrName: 'r-if',
  elseAttrName: 'r-else',
  elseIfAttrName: 'r-else-if'
}

module.exports = function () {
  // 以if为初始起点 再转化底下相关的else-if else 周而复始 就解决了关联性的问题了
  function JSXElementVisitor(path) {
    const {
      ifAttrName,
      elseAttrName,
      elseIfAttrName
    } = defaultOpts;
    const ifBinding = getAttrASTAndIndexByName(path.node, ifAttrName)
    if (!ifBinding) { return }
    let {
      parent: { children: siblings },
      key: index
    } = path
    let nextNode = findNextNode(path, siblings, index)
    let elseBinding = getAttrASTAndIndexByName(nextNode, elseAttrName);
    let elseIfBinding = getAttrASTAndIndexByName(nextNode, elseIfAttrName);
    /******************* 处理只有if的情况 ******************************/

    if (!nextNode || !elseBinding && !elseIfBinding) { return transformIfBinding(path, ifBinding) }

    const elseIfBindings = []
    /******************* 处理if else-if else情况 ******************************/
    if (!elseBinding) {
      let elseIfBinding = getAttrASTAndIndexByName(nextNode, elseIfAttrName)
      while (elseIfBinding) {
        elseIfBindings.push(elseIfBinding)
        index += 1
        nextNode = findNextNode(path, siblings, index)
        elseIfBinding = nextNode ? getAttrASTAndIndexByName(nextNode, elseIfAttrName) : null
      }
      if (nextNode) {
        elseBinding = getAttrASTAndIndexByName(nextNode, elseAttrName)
      }
    }
    if (elseIfBindings.length > 0) {
      transformElseIfBindings(path, ifBinding, elseIfBindings, elseBinding)
      elseIfBindings.forEach((binding) => {
        removeNode(siblings, binding.node);
      })
      if (elseBinding) {
        removeNode(siblings, elseBinding.node);
      }
    }
    /********************** if else情况*********************************/
    else if (elseBinding) {
      transformElseBinding(path, ifBinding, elseBinding);
      removeNode(siblings, elseBinding.node);
    }


  }

  return {
    visitor: {
      JSXElement: JSXElementVisitor
    }
  }

}
