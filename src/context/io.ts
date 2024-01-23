// context definition
import { io } from 'socket.io-client';

const socketCtx = io(process.env.REACT_APP_API_HOST, {
    autoConnect: false
});

export { socketCtx }
