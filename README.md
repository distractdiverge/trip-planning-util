# Trip Planner CLI

A TypeScript CLI tool for calculating pessimistic travel schedules for two-leg trips: home → ex's house → event venue.

## Features

- **Pessimistic scheduling** with configurable buffers
- **Time rounding** for practical departure times
- **Multiple output formats**: text, JSON, ICS calendar files
- **Configuration profiles** for different scenarios (practice vs games)
- **Address aliases** for frequently used locations
- **Timezone support** with DST handling

## Installation

```bash
npm install
npm run build
npm link  # or npm install -g
```

## Quick Start

```bash
# Basic usage with manual travel times
planner plan \
  --arrive "2025-10-01T18:00" \
  --manual-home-ex 17 \
  --manual-ex-event 15 \
  --arrive-early 10

# Output:
# Leave home by 4:55 PM - 17 min drive to ex's (+5)
# Arrive ex's at 5:20 PM - 10 mins to get ready  
# Leave ex's by 5:30 PM - 15 min drive to event (+5)
# Arrive event at 5:50 PM (arrive early 10 mins)
```

## Commands

### `planner plan`

Calculate and display travel schedule.

**Required:**
- `--arrive <time>` - Event time (ISO format or "5:50pm")
- `--manual-home-ex <minutes>` - Drive time home to ex's
- `--manual-ex-event <minutes>` - Drive time ex's to event

**Optional:**
- `--date <date>` - Date when using time format for --arrive
- `--arrive-early <minutes>` - Minutes early at venue (default: 10)
- `--pickup-ready <minutes>` - Minutes needed at ex's (default: 10)  
- `--drive-buffer <minutes>` - Extra minutes per leg (default: 5)
- `--round <minutes>` - Round departure times (default: 5)
- `--format <type>` - Output: text, json, ics (default: text)
- `--timezone <tz>` - Override timezone
- `--profile <name>` - Use config profile

### `planner config`

Manage configuration and aliases.

- `--list` - Show current configuration
- `--set-alias <name> <address>` - Set address alias

### `planner cache`

Manage travel time cache (future feature).

## Configuration

Config stored in `~/.trip_planner/config.json`:

```json
{
  "profiles": {
    "default": {
      "name": "default",
      "defaults": {
        "arriveEarly": 10,
        "pickupReady": 10,
        "driveBuffer": 5,
        "roundTo": 5
      }
    }
  },
  "aliases": {
    "Home": "123 Main St, City, State",
    "Ex House": "456 Oak Ave, City, State",
    "Soccer Complex": "789 Sports Dr, City, State"
  },
  "defaults": {
    "arriveEarly": 10,
    "pickupReady": 10,
    "driveBuffer": 5,
    "roundTo": 5,
    "timezone": "local"
  }
}
```

## Algorithm

The scheduling algorithm follows this sequence:

1. **T_must_arrive** = T_event - arrive_early
2. **T_leave_ex** = T_must_arrive - (ex_to_event_duration + drive_buffer)  
3. **T_arrive_ex** = T_leave_ex - pickup_ready
4. **T_leave_home_raw** = T_arrive_ex - (home_to_ex_duration + drive_buffer)
5. **T_leave_home** = floor_to_interval(T_leave_home_raw, round_to)

All times are calculated pessimistically with buffers to ensure on-time arrival.

## Examples

### Different Output Formats

```bash
# JSON output
planner plan --arrive "6:00pm" --date "2025-10-01" \
  --manual-home-ex 17 --manual-ex-event 15 --format json

# ICS calendar file  
planner plan --arrive "2025-10-01T18:00" \
  --manual-home-ex 17 --manual-ex-event 15 --format ics > schedule.ics
```

### Using Profiles

```bash
# Create a soccer practice profile
planner config --profile soccer-practice

# Use the profile
planner plan --profile soccer-practice \
  --arrive "2025-10-01T18:00" \
  --manual-home-ex 17 --manual-ex-event 15
```

## Development

```bash
# Install dependencies
npm install

# Run in development
npm run dev

# Build
npm run build

# Run tests
npm test

# Type checking
npm run typecheck

# Linting  
npm run lint
```

## Testing

The test suite includes:

- **Golden test scenario** matching the spec requirements
- **Edge cases** for time boundaries and DST
- **Rounding behavior** validation
- **Configuration management** tests

```bash
npm test
```

## Roadmap

- **v1.1**: Google Distance Matrix integration for automatic travel times
- **v1.2**: Raycast extension and Apple Shortcuts integration  
- **v1.3**: Calendar auto-import features
- **v2.0**: Web API and cloud sync capabilities

## License

MIT