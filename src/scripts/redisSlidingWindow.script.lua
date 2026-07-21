-- KEYS[1] = the window key
-- ARGV[1] = windowSize (ms)
-- ARGV[2] = maxRequests
-- ARGV[3] = now (ms)

local key = KEYS[1]
local windowSize = tonumber(ARGV[1])
local maxRequests = tonumber(ARGV[2])
local now = tonumber(ARGV[3])
local start = now - windowSize

-- Drop timestamps at or before the window start (matches your `ts > start` exclusive check)
redis.call("ZREMRANGEBYSCORE", key, "-inf", start)

local count = redis.call("ZCARD", key)

if count < maxRequests then
  -- member must be unique per entry even if two requests land in the same millisecond,
  -- so we suffix with a per-key counter rather than using `now` alone as the member
  local seq = redis.call("INCR", key .. ":seq")
  redis.call("ZADD", key, now, now .. "-" .. seq)
  redis.call("PEXPIRE", key, windowSize)  -- let Redis garbage-collect idle keys automatically
  return true 
else
  return false 
end