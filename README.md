# 如何使用

```javascript

<div>
  <h1 r-if={height < 170}>good</h1>
  <h1 r-else-if={height >180}>best</h1>
  <h1 r-else>other</h1>
</div>


```

# 效果

```javascript

React.createElement("div", null, (() => {
  if (height < 170) return React.createElement("h1", null, "good");else if (height > 180) return React.createElement("h1", null, "best");else return React.createElement("h1", null, "other");
})());


```