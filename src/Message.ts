import { BookmarkTreeSelection } from "./bookmark-tree";
import { Snapshot } from "./link-stack.d";
import { TabCreateProps } from "./view-model.d";

export enum MsgType {
  Intention,
  Id,
  Snapshot,
  TabCreateProps,
  BookmarkTreeSelection
}

export type Message<T extends MsgType> = T extends MsgType.Intention
  ? {
      intention: string;
      type: T;
    }
  : {
      intention?: string;
      type: T;
      data: T extends MsgType.Id
        ? string
        : T extends MsgType.Snapshot
          ? Snapshot
          : T extends MsgType.TabCreateProps
            ? TabCreateProps
            : T extends MsgType.BookmarkTreeSelection
              ? BookmarkTreeSelection | null
              : never;
    };

const isMessage = <T extends MsgType>(
  o: any,
  msgType: T
): o is Message<typeof msgType> => {
  return (o as Message<T>).type === msgType;
};

const createMessage = <T extends MsgType>(msg: Message<T>): Message<T> => msg;
const createIntention = (intention: string) =>
  createMessage<MsgType.Intention>({
    intention,
    type: MsgType.Intention
  });

export { isMessage, createMessage, createIntention };
