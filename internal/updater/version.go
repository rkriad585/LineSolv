package updater

import (
	"fmt"
	"strconv"
	"strings"
)

// Version represents a semantic version with major, minor, and patch components.
type Version struct {
	Major int
	Minor int
	Patch int
	Pre   string // pre-release identifier (e.g., "alpha.1", "beta.2")
	Build string // build metadata (e.g., "20260716")
}

// ParseVersion parses a version string like "1.2.3", "v1.2.3", "1.2.3-alpha.1", or "1.2.3+build.123".
func ParseVersion(s string) (Version, error) {
	s = strings.TrimPrefix(s, "v")
	s = strings.TrimSpace(s)

	// Split build metadata
	build := ""
	if idx := strings.Index(s, "+"); idx != -1 {
		build = s[idx+1:]
		s = s[:idx]
	}

	// Split pre-release
	pre := ""
	if idx := strings.Index(s, "-"); idx != -1 {
		pre = s[idx+1:]
		s = s[:idx]
	}

	parts := strings.Split(s, ".")
	if len(parts) < 2 || len(parts) > 3 {
		return Version{}, fmt.Errorf("invalid version format: %q", s)
	}

	major, err := strconv.Atoi(parts[0])
	if err != nil {
		return Version{}, fmt.Errorf("invalid major version: %q", parts[0])
	}

	minor, err := strconv.Atoi(parts[1])
	if err != nil {
		return Version{}, fmt.Errorf("invalid minor version: %q", parts[1])
	}

	patch := 0
	if len(parts) == 3 {
		patch, err = strconv.Atoi(parts[2])
		if err != nil {
			return Version{}, fmt.Errorf("invalid patch version: %q", parts[2])
		}
	}

	return Version{
		Major: major,
		Minor: minor,
		Patch: patch,
		Pre:   pre,
		Build: build,
	}, nil
}

// String returns the version as a string like "1.2.3" or "1.2.3-alpha.1".
func (v Version) String() string {
	s := fmt.Sprintf("%d.%d.%d", v.Major, v.Minor, v.Patch)
	if v.Pre != "" {
		s += "-" + v.Pre
	}
	if v.Build != "" {
		s += "+" + v.Build
	}
	return s
}

// GT returns true if v is greater than other.
// Pre-release versions are lower than the same version without a pre-release.
// For example, 1.2.3-alpha.1 < 1.2.3 < 1.2.3-beta.1 < 1.3.0.
func (v Version) GT(other Version) bool {
	if v.Major != other.Major {
		return v.Major > other.Major
	}
	if v.Minor != other.Minor {
		return v.Minor > other.Minor
	}
	if v.Patch != other.Patch {
		return v.Patch > other.Patch
	}

	// Same major.minor.patch — compare pre-release
	// No pre-release > has pre-release (e.g., 1.2.3 > 1.2.3-alpha.1)
	if v.Pre == "" && other.Pre != "" {
		return true
	}
	if v.Pre != "" && other.Pre == "" {
		return false
	}

	// Both have pre-release — lexicographic comparison
	return v.Pre > other.Pre
}

// EQ returns true if v equals other (ignoring build metadata).
func (v Version) EQ(other Version) bool {
	return v.Major == other.Major && v.Minor == other.Minor && v.Patch == other.Patch && v.Pre == other.Pre
}

// IsValid returns true if the version has at least major.minor.
func (v Version) IsValid() bool {
	return v.Major > 0 || v.Minor > 0
}

// UpdateChannel represents the type of release channel.
type UpdateChannel string

const (
	ChannelStable  UpdateChannel = "stable"
	ChannelBeta    UpdateChannel = "beta"
	ChannelNightly UpdateChannel = "nightly"
)

// IsCompatibleChannel returns true if the release version is compatible with the given channel.
func IsCompatibleChannel(releaseVer Version, channel UpdateChannel) bool {
	switch channel {
	case ChannelStable:
		return releaseVer.Pre == ""
	case ChannelBeta:
		return strings.Contains(releaseVer.Pre, "beta") || releaseVer.Pre == ""
	case ChannelNightly:
		return true // nightlies accept everything
	default:
		return true
	}
}

// IsUpdateAvailable returns true if latest is newer than current and compatible with the channel.
func IsUpdateAvailable(current, latest Version, channel UpdateChannel) bool {
	if !latest.GT(current) {
		return false
	}
	return IsCompatibleChannel(latest, channel)
}
