package plugin

import (
	"fmt"
	"math"
	"strings"

	"LineSolv/app/calculator"

	"github.com/dop251/goja"
)

type PluginRuntime struct {
	vm     *goja.Runtime
	engine *calculator.Engine
	funcs  map[string]goja.Callable
}

func NewPluginRuntime(engine *calculator.Engine) *PluginRuntime {
	rt := &PluginRuntime{
		vm:     goja.New(),
		engine: engine,
		funcs:  make(map[string]goja.Callable),
	}

	numiObj := rt.vm.NewObject()
	numiObj.Set("addUnit", rt.addUnit)
	numiObj.Set("addFunction", rt.addFunction)
	numiObj.Set("setVariable", rt.setVariable)
	rt.vm.Set("numi", numiObj)

	return rt
}

func (rt *PluginRuntime) RunScript(source string) error {
	// Wrap in IIFE to isolate each plugin's scope (plugins reuse let/const)
	source = "(function(){\n" + source + "\n})()"
	_, err := rt.vm.RunString(source)
	return err
}

func (rt *PluginRuntime) addUnit(call goja.FunctionCall) goja.Value {
	if len(call.Arguments) < 1 {
		return goja.Undefined()
	}
	obj := call.Arguments[0].ToObject(rt.vm)

	id := rt.getString(obj, "id")
	phrases := rt.getString(obj, "phrases")
	format := rt.getString(obj, "format")
	ratio := rt.getFloat(obj, "ratio")

	if id == "" || ratio == 0 {
		return goja.Undefined()
	}

	rt.engine.RegisterUnit(id, phrases, format, ratio)
	return goja.Undefined()
}

func (rt *PluginRuntime) addFunction(call goja.FunctionCall) goja.Value {
	if len(call.Arguments) < 2 {
		return goja.Undefined()
	}
	opts := call.Arguments[0].ToObject(rt.vm)
	fn, ok := goja.AssertFunction(call.Arguments[1])
	if !ok {
		return goja.Undefined()
	}

	id := rt.getString(opts, "id")
	if id == "" {
		return goja.Undefined()
	}

	id = strings.ToLower(id)
	rt.funcs[id] = fn

	rt.engine.RegisterPluginFunction(id, func(args []float64) (float64, error) {
		return rt.callPluginFunc(fn, args)
	})

	return goja.Undefined()
}

func (rt *PluginRuntime) setVariable(call goja.FunctionCall) goja.Value {
	if len(call.Arguments) < 2 {
		return goja.Undefined()
	}
	name := call.Arguments[0].String()
	val := call.Arguments[1].ToFloat()
	rt.engine.SetVariable(name, val)
	return goja.Undefined()
}

func (rt *PluginRuntime) callPluginFunc(fn goja.Callable, args []float64) (float64, error) {
	// Build values array: each value is {double: n}
	vals := make([]interface{}, len(args))
	for i, a := range args {
		vals[i] = map[string]interface{}{"double": a}
	}

	result, err := fn(goja.Undefined(), rt.vm.ToValue(vals))
	if err != nil {
		return 0, fmt.Errorf("plugin function error: %w", err)
	}

	if goja.IsUndefined(result) || goja.IsNull(result) {
		return 0, fmt.Errorf("plugin function returned no value")
	}

	// Result may be a number directly or {double: n}
	if num := result.ToFloat(); !math.IsNaN(num) {
		return num, nil
	}

	obj := result.ToObject(rt.vm)
	double := rt.getFloat(obj, "double")
	return double, nil
}

func (rt *PluginRuntime) getString(obj *goja.Object, key string) string {
	v := obj.Get(key)
	if goja.IsUndefined(v) || goja.IsNull(v) {
		return ""
	}
	return v.String()
}

func (rt *PluginRuntime) getFloat(obj *goja.Object, key string) float64 {
	v := obj.Get(key)
	if goja.IsUndefined(v) || goja.IsNull(v) {
		return 0
	}
	return v.ToFloat()
}
