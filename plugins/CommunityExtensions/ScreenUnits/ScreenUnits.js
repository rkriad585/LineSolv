let basePx = 16;

linesolv.addUnit({
  "id": "px",
  "phrases": "pixel, pixels, px",
  "baseUnitId": "px",
  "format" : "px",
  "ratio" : 1,
});

linesolv.addUnit({
  "id": "rem",
  "phrases": "rem",
  "baseUnitId": "px",
  "format" : "rem",
  "ratio" : basePx,
});

var calculate = function (original, base) {
  if (!base) {
    base = basePx;
  }

  return (original / base);
}

linesolv.addFunction({ "id": "toRem", "phrases": "toRem, convertRem" }, function(values) {
  if (typeof values[1] === 'object') {
    return {"double" : calculate (values[0].double, values[1].double)};
  }
  if (typeof values[0] === 'object') {
    return {"double" : calculate (values[0].double)};
  }

  return 0;
});