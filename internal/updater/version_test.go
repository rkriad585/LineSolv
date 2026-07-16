package updater

import (
	"testing"
)

func TestParseVersion(t *testing.T) {
	tests := []struct {
		input   string
		want    Version
		wantErr bool
	}{
		{"1.2.3", Version{Major: 1, Minor: 2, Patch: 3}, false},
		{"v1.2.3", Version{Major: 1, Minor: 2, Patch: 3}, false},
		{"0.15.10", Version{Major: 0, Minor: 15, Patch: 10}, false},
		{"1.2.3-alpha.1", Version{Major: 1, Minor: 2, Patch: 3, Pre: "alpha.1"}, false},
		{"1.2.3-beta.2+build.123", Version{Major: 1, Minor: 2, Patch: 3, Pre: "beta.2", Build: "build.123"}, false},
		{"1.2", Version{Major: 1, Minor: 2}, false},
		{"", Version{}, true},
		{"abc", Version{}, true},
		{"1.2.3.4", Version{}, true},
	}

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			got, err := ParseVersion(tt.input)
			if (err != nil) != tt.wantErr {
				t.Errorf("ParseVersion(%q) error = %v, wantErr %v", tt.input, err, tt.wantErr)
				return
			}
			if !tt.wantErr {
				if got.Major != tt.want.Major || got.Minor != tt.want.Minor || got.Patch != tt.want.Patch {
					t.Errorf("ParseVersion(%q) = %+v, want %+v", tt.input, got, tt.want)
				}
				if got.Pre != tt.want.Pre {
					t.Errorf("ParseVersion(%q) Pre = %q, want %q", tt.input, got.Pre, tt.want.Pre)
				}
			}
		})
	}
}

func TestVersionString(t *testing.T) {
	tests := []struct {
		v    Version
		want string
	}{
		{Version{Major: 1, Minor: 2, Patch: 3}, "1.2.3"},
		{Version{Major: 0, Minor: 15, Patch: 10}, "0.15.10"},
		{Version{Major: 1, Minor: 2, Patch: 3, Pre: "alpha.1"}, "1.2.3-alpha.1"},
		{Version{Major: 1, Minor: 2, Patch: 3, Pre: "beta.2", Build: "build.123"}, "1.2.3-beta.2+build.123"},
	}

	for _, tt := range tests {
		t.Run(tt.want, func(t *testing.T) {
			if got := tt.v.String(); got != tt.want {
				t.Errorf("Version.String() = %q, want %q", got, tt.want)
			}
		})
	}
}

func TestVersionGT(t *testing.T) {
	tests := []struct {
		name string
		a, b Version
		want bool
	}{
		{"major greater", Version{Major: 2}, Version{Major: 1}, true},
		{"major lesser", Version{Major: 1}, Version{Major: 2}, false},
		{"minor greater", Version{1, 3, 0, "", ""}, Version{1, 2, 0, "", ""}, true},
		{"minor lesser", Version{1, 2, 0, "", ""}, Version{1, 3, 0, "", ""}, false},
		{"patch greater", Version{1, 2, 4, "", ""}, Version{1, 2, 3, "", ""}, true},
		{"patch lesser", Version{1, 2, 3, "", ""}, Version{1, 2, 4, "", ""}, false},
		{"equal", Version{1, 2, 3, "", ""}, Version{1, 2, 3, "", ""}, false},
		{"pre-release < release", Version{1, 2, 3, "alpha.1", ""}, Version{1, 2, 3, "", ""}, false},
		{"release > pre-release", Version{1, 2, 3, "", ""}, Version{1, 2, 3, "alpha.1", ""}, true},
		{"alpha < beta", Version{1, 2, 3, "alpha.1", ""}, Version{1, 2, 3, "beta.1", ""}, false},
		{"beta > alpha", Version{1, 2, 3, "beta.1", ""}, Version{1, 2, 3, "alpha.1", ""}, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := tt.a.GT(tt.b); got != tt.want {
				t.Errorf("Version.GT() = %v, want %v (%+v > %+v)", got, tt.want, tt.a, tt.b)
			}
		})
	}
}

func TestVersionEQ(t *testing.T) {
	a := Version{1, 2, 3, "alpha.1", "build.123"}
	b := Version{1, 2, 3, "alpha.1", "build.456"} // different build
	c := Version{1, 2, 3, "", ""}                 // different pre

	if !a.EQ(b) {
		t.Error("versions with different build metadata should be equal")
	}
	if a.EQ(c) {
		t.Error("versions with different pre-release should not be equal")
	}
}

func TestIsCompatibleChannel(t *testing.T) {
	tests := []struct {
		version Version
		channel UpdateChannel
		want    bool
	}{
		{Version{1, 2, 3, "", ""}, ChannelStable, true},
		{Version{1, 2, 3, "beta.1", ""}, ChannelStable, false},
		{Version{1, 2, 3, "beta.1", ""}, ChannelBeta, true},
		{Version{1, 2, 3, "", ""}, ChannelBeta, true},
		{Version{1, 2, 3, "alpha.1", ""}, ChannelBeta, false},
		{Version{1, 2, 3, "alpha.1", ""}, ChannelNightly, true},
		{Version{1, 2, 3, "", ""}, ChannelNightly, true},
	}

	for _, tt := range tests {
		t.Run(string(tt.channel)+"_"+tt.version.String(), func(t *testing.T) {
			if got := IsCompatibleChannel(tt.version, tt.channel); got != tt.want {
				t.Errorf("IsCompatibleChannel(%v, %s) = %v, want %v", tt.version, tt.channel, got, tt.want)
			}
		})
	}
}

func TestIsUpdateAvailable(t *testing.T) {
	current := Version{0, 15, 0, "", ""}
	latestNewer := Version{0, 15, 10, "", ""}
	latestOlder := Version{0, 14, 0, "", ""}
	latestBeta := Version{0, 16, 0, "beta.1", ""}

	if !IsUpdateAvailable(current, latestNewer, ChannelStable) {
		t.Error("should detect update available")
	}
	if IsUpdateAvailable(current, latestOlder, ChannelStable) {
		t.Error("should not detect update for older version")
	}
	if IsUpdateAvailable(current, current, ChannelStable) {
		t.Error("should not detect update for same version")
	}
	if IsUpdateAvailable(current, latestBeta, ChannelStable) {
		t.Error("should not detect beta update in stable channel")
	}
	if !IsUpdateAvailable(current, latestBeta, ChannelBeta) {
		t.Error("should detect beta update in beta channel")
	}
}
