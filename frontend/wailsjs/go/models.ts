export namespace calculator {
	
	export class Step {
	    operation: string;
	    expression: string;
	    result: string;
	
	    static createFrom(source: any = {}) {
	        return new Step(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.operation = source["operation"];
	        this.expression = source["expression"];
	        this.result = source["result"];
	    }
	}
	export class EvalDetail {
	    result: string;
	    steps: Step[];
	
	    static createFrom(source: any = {}) {
	        return new EvalDetail(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.result = source["result"];
	        this.steps = this.convertValues(source["steps"], Step);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Point {
	    x: number;
	    y: number;
	
	    static createFrom(source: any = {}) {
	        return new Point(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.x = source["x"];
	        this.y = source["y"];
	    }
	}
	export class GraphResult {
	    points: Point[];
	    expression: string;
	    from: number;
	    to: number;
	
	    static createFrom(source: any = {}) {
	        return new GraphResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.points = this.convertValues(source["points"], Point);
	        this.expression = source["expression"];
	        this.from = source["from"];
	        this.to = source["to"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class HistoryEntry {
	    input: string;
	    output: string;
	
	    static createFrom(source: any = {}) {
	        return new HistoryEntry(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.input = source["input"];
	        this.output = source["output"];
	    }
	}
	

}

export namespace plugin {
	
	export class FunctionDef {
	    name: string;
	    description: string;
	    args: number;
	    min_args: number;
	    max_args: number;
	    expression?: string;
	    builtin?: string;
	    examples?: string[];
	
	    static createFrom(source: any = {}) {
	        return new FunctionDef(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.description = source["description"];
	        this.args = source["args"];
	        this.min_args = source["min_args"];
	        this.max_args = source["max_args"];
	        this.expression = source["expression"];
	        this.builtin = source["builtin"];
	        this.examples = source["examples"];
	    }
	}
	export class VariableDef {
	    name: string;
	    description: string;
	    value: number;
	
	    static createFrom(source: any = {}) {
	        return new VariableDef(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.description = source["description"];
	        this.value = source["value"];
	    }
	}
	export class ThemeDef {
	    id: string;
	    label: string;
	    colors: Record<string, string>;
	
	    static createFrom(source: any = {}) {
	        return new ThemeDef(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.label = source["label"];
	        this.colors = source["colors"];
	    }
	}
	export class PluginInfo {
	    name: string;
	    version: string;
	    description: string;
	    author: string;
	    homepage?: string;
	    dir: string;
	    enabled: boolean;
	    error?: string;
	    functions?: FunctionDef[];
	    themes?: ThemeDef[];
	    variables?: VariableDef[];
	
	    static createFrom(source: any = {}) {
	        return new PluginInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.version = source["version"];
	        this.description = source["description"];
	        this.author = source["author"];
	        this.homepage = source["homepage"];
	        this.dir = source["dir"];
	        this.enabled = source["enabled"];
	        this.error = source["error"];
	        this.functions = this.convertValues(source["functions"], FunctionDef);
	        this.themes = this.convertValues(source["themes"], ThemeDef);
	        this.variables = this.convertValues(source["variables"], VariableDef);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	

}

export namespace service {
	
	export class AutocompleteItem {
	    name: string;
	    category: string;
	    description: string;
	
	    static createFrom(source: any = {}) {
	        return new AutocompleteItem(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.category = source["category"];
	        this.description = source["description"];
	    }
	}
	export class CurrencyCacheInfo {
	    cached: boolean;
	    updatedAt: number;
	    source: string;
	
	    static createFrom(source: any = {}) {
	        return new CurrencyCacheInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.cached = source["cached"];
	        this.updatedAt = source["updatedAt"];
	        this.source = source["source"];
	    }
	}
	export class SettingsData {
	    theme: string;
	    font_size: string;
	    font_family: string;
	    shortcut_overrides: string;
	    autocomplete_enabled: string;
	    animations_enabled: string;
	    toast_enabled: string;
	    opacity: string;
	    line_numbers_enabled: string;
	    result_panel_enabled: string;
	    line_wrap_enabled: string;
	    ui_style: string;
	    theme_manually_set: string;
	
	    static createFrom(source: any = {}) {
	        return new SettingsData(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.theme = source["theme"];
	        this.font_size = source["font_size"];
	        this.font_family = source["font_family"];
	        this.shortcut_overrides = source["shortcut_overrides"];
	        this.autocomplete_enabled = source["autocomplete_enabled"];
	        this.animations_enabled = source["animations_enabled"];
	        this.toast_enabled = source["toast_enabled"];
	        this.opacity = source["opacity"];
	        this.line_numbers_enabled = source["line_numbers_enabled"];
	        this.result_panel_enabled = source["result_panel_enabled"];
	        this.line_wrap_enabled = source["line_wrap_enabled"];
	        this.ui_style = source["ui_style"];
	        this.theme_manually_set = source["theme_manually_set"];
	    }
	}

}

export namespace storage {
	
	export class Note {
	    id: string;
	    name: string;
	    content: string;
	    createdAt: number;
	    updatedAt: number;
	    position: number;
	
	    static createFrom(source: any = {}) {
	        return new Note(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.content = source["content"];
	        this.createdAt = source["createdAt"];
	        this.updatedAt = source["updatedAt"];
	        this.position = source["position"];
	    }
	}

}

