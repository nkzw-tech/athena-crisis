import { MessageTag } from '@deities/athena/message/Message.tsx';
import UnknownTypeError from '@nkzw/core/UnknownTypeError.js';
import { fbt } from 'fbtee';

export default function getTranslatedMessageTagName(tag: MessageTag) {
  switch (tag) {
    case MessageTag.Building:
      return fbt('Building', 'Message tag for building');
    case MessageTag.Unit:
      return fbt('Unit', 'Message tag for unit');
    case MessageTag.Tile:
      return fbt('Field', 'Message tag for tile');
    case MessageTag.Threat:
      return fbt('Threat', 'Message tag for threat');
    case MessageTag.Strategy:
      return fbt('Strategy', 'Message tag for strategy');
    case MessageTag.Social:
      return fbt('Social', 'Message tag for social');
    case MessageTag.Resource:
      return fbt('Resource', 'Message tag for resource');
    case MessageTag.Comment:
      return fbt('Comment', 'Message tag for comment');
    case MessageTag.Teamplay:
      return fbt('Teamplay', 'Message tag for teamplay');
    case MessageTag.Skill:
      return fbt('Skill', 'Message tag for skill');
    case MessageTag.Faction:
      return fbt('Faction', 'Message tag for faction');
    default: {
      tag satisfies never;
      throw new UnknownTypeError('getTranslatedMessageTagName', tag);
    }
  }
}
