export namespace calculator {
	
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

export namespace service {
	
	export class SettingsData {
	    font_size: string;
	    font_family: string;
	    shortcut_overrides: string;
	
	    static createFrom(source: any = {}) {
	        return new SettingsData(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.font_size = source["font_size"];
	        this.font_family = source["font_family"];
	        this.shortcut_overrides = source["shortcut_overrides"];
	    }
	}
	export class UpdateInfo {
	    update_available: boolean;
	    current_version: string;
	    latest_version: string;
	    download_url: string;
	
	    static createFrom(source: any = {}) {
	        return new UpdateInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.update_available = source["update_available"];
	        this.current_version = source["current_version"];
	        this.latest_version = source["latest_version"];
	        this.download_url = source["download_url"];
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
	    }
	}

}

