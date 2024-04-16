// context definition
import { io } from 'socket.io-client';
import { BASE_URL }  from "../constants/api"

const socketCtx = io(BASE_URL, {
    autoConnect: false
});

export { socketCtx }
