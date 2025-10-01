# Trip Planner CLI

A TypeScript CLI tool for calculating pessimistic travel schedules for multi-stop trips using natural language routing: "from home to school" automatically resolves locations and plans the optimal pickup schedule.

## Features

- **Pessimistic scheduling** with configurable buffers
- **Time rounding** for practical departure times
- **Natural language routing**: "from home to school" or "from home via ex's house to soccer field"
- **Location categories**: Organize locations by type (homes, schools, venues, stops)
- **Multiple output formats**: text, JSON, ICS calendar files
- **Configuration profiles** for different scenarios (practice vs games)
- **Timezone support** with DST handling

## Installation

```bash
npm install
npm run build
npm link  # or npm install -g
```

## Quick Start

```bash
# Natural language routing (easiest!)
planner route \
  --route "from home to school" \
  --arrive "2025-10-01T18:00" \
  --home-stop-time 17 \
  --stop-destination-time 15

# Output:
# 📍 Route: home → ex's house → school
# Leave home by 4:55 PM - 17 min drive to stop (+5)
# Arrive stop at 5:20 PM - 10 mins to get ready  
# Leave stop by 5:30 PM - 15 min drive to event (+5)
# Arrive event at 5:50 PM (arrive early 10 mins)

# Or explicit manual planning
planner plan \
  --arrive "2025-10-01T18:00" \
  --manual-home-stop 17 \
  --manual-stop-event 15 \
  --arrive-early 10
```

## Commands

### `planner route`

Plan routes using natural language descriptions.

**Required:**
- `--route <description>` - Route like "from home to school" or "from home via ex's house to soccer field"
- `--arrive <time>` - Event arrival time (ISO format or "5:50pm")
- `--home-stop-time <minutes>` - Drive time from start to stop
- `--stop-destination-time <minutes>` - Drive time from stop to destination

**Optional:**
- `--date <date>` - Date when using time format for --arrive
- `--arrive-early <minutes>` - Minutes early at venue (default: 10)
- `--pickup-ready <minutes>` - Minutes needed at stop (default: 10)  
- `--drive-buffer <minutes>` - Extra minutes per leg (default: 5)
- `--round <minutes>` - Round departure times (default: 5)
- `--format <type>` - Output: text, json, ics (default: text)
- `--timezone <tz>` - Override timezone
- `--profile <name>` - Use config profile

### `planner plan`

Calculate and display travel schedule.

**Required:**
- `--arrive <time>` - Event time (ISO format or "5:50pm")
- `--manual-home-stop <minutes>` - Drive time home to stop
- `--manual-stop-event <minutes>` - Drive time stop to event

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
- `--list-locations [category]` - List all locations or filter by category
- `--add-location <location>` - Add location in format "category:name=address"
- `--remove-location <location>` - Remove location in format "category:name"
- `--set-alias <alias>` - Set address alias in format "name=address"
- `--remove-alias <name>` - Remove address alias

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
  "locations": {
    "homes": {
      "home": "123 Main St, Default City",
      "my house": "123 Main St, Default City"
    },
    "schools": {
      "school": "Elementary School, 456 School St",
      "the school": "Elementary School, 456 School St"
    },
    "venues": {
      "soccer field": "Community Soccer Complex, 789 Sports Dr",
      "basketball court": "Indoor Sports Center, 555 Hoops Ave"
    },
    "stops": {
      "ex's house": "456 Oak Ave, Pickup Location",
      "dad's house": "789 Elm Street, Other Parent Location"
    },
    "other": {}
  },
  "aliases": {
    "Home": "123 Main St, City, State"
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
2. **T_leave_stop** = T_must_arrive - (stop_to_event_duration + drive_buffer)  
3. **T_arrive_stop** = T_leave_stop - pickup_ready
4. **T_leave_home_raw** = T_arrive_stop - (home_to_stop_duration + drive_buffer)
5. **T_leave_home** = floor_to_interval(T_leave_home_raw, round_to)

All times are calculated pessimistically with buffers to ensure on-time arrival.

## Examples

### Natural Language Routing

```bash
# Basic two-location routing (automatically finds intermediate stop)
planner route --route "from home to school" \
  --arrive "2025-10-01T18:00" \
  --home-stop-time 17 --stop-destination-time 15

# Explicit three-location routing
planner route --route "from my house via dad's house to basketball court" \
  --arrive "2025-10-01T19:30" \
  --home-stop-time 15 --stop-destination-time 8

# Different output formats
planner route --route "from home to soccer field" \
  --arrive "2025-10-01T18:00" \
  --home-stop-time 20 --stop-destination-time 12 \
  --format json
```

### Managing Locations

```bash
# Add locations by category
planner config --add-location "homes:my house=123 Main St, My City"
planner config --add-location "schools:elementary=456 School Ave"
planner config --add-location "venues:soccer field=789 Sports Dr"
planner config --add-location "stops:ex's house=456 Oak Ave"

# List all locations
planner config --list-locations

# List specific category
planner config --list-locations homes

# Remove a location
planner config --remove-location "venues:old field"
```

### Legacy Manual Planning

```bash
# Manual mode (for custom scenarios)
planner plan --arrive "2025-10-01T18:00" \
  --manual-home-stop 17 --manual-stop-event 15

# With aliases
planner plan --arrive "2025-10-01T18:00" \
  --home "Home" --stop "Stop 1" --event "Soccer Field" \
  --manual-home-stop 17 --manual-stop-event 15
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