import { atom } from "jotai";

/**
 *  Modal
 */
const openModalAtom = atom<boolean>(false);

/**
 *  Message
 */
const messageAtom = atom<MessageType | null>(null);

/**
 *  Sign
 */
const signAtom = atom<(HTMLCanvasElement | string)[]>([]);

/**
 *  canvas
 */
const fileAtom = atom<pdfFileType[] | null>(null);

export { openModalAtom, messageAtom, signAtom, fileAtom };
