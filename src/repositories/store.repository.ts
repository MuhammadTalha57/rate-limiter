import MemoryStore from "./memoryStore.repository.js";
import RedisStore from "./redisStore.repository.js";

const store =
	process.env.STORE_TYPE === "Redis" ? new RedisStore() : new MemoryStore();
export default store;
