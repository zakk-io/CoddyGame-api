const {createClient} = require('redis');
require('dotenv').config()


const redisClient = createClient({
    username: 'default',
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,

    }
});

const connectRedis = async () => {
    try {
        redisClient.connect()
        console.log('Redis connected');
        
    } catch (error) {
        console.error('Redis connection error:', error);
    }
}

connectRedis()

module.exports = redisClient;


