import { CommandExecutor } from './types';
import { addSpamInterval } from '../spamController';

export const spamCommandExecutor: CommandExecutor = ({ pluginApi, args }) => {
  if (!args || args.length < 1) {
    pluginApi.serverCommands?.chat.sendPublicChatMessage({
      textMessageInMarkdownFormat: 'Usage: `/spam "message with spaces" [times]` or `/spam "message" interval <ms>`',
    });
    return;
  }

  // Parse message and parameters
  let message: string;
  let remainingArgs: string[];
  let messageCounter = 1;

  // Check if message is quoted
  const fullArgsString = args.join(' ');
  const quotedMatch = fullArgsString.match(/^"([^"]*)"(.*)$/);

  if (quotedMatch) {
    // Message is quoted: /spam "hello world" 5
    [, message] = quotedMatch;
    remainingArgs = quotedMatch[2].trim().split(' ').filter((arg) => arg.length > 0);
  } else {
    // Check if we have interval mode without quotes: /spam hello world interval 2
    const intervalIndex = args.findIndex((arg) => arg === 'interval');
    if (intervalIndex !== -1 && intervalIndex < args.length - 1) {
      // Everything before 'interval' is the message
      message = args.slice(0, intervalIndex).join(' ');
      remainingArgs = ['interval', args[intervalIndex + 1]];
    } else {
      // Check if last argument is a number (times mode): /spam hello world 5
      const lastArg = args[args.length - 1];
      const isNumber = /^\d+$/.test(lastArg);

      if (isNumber && args.length > 1) {
        // Everything except last number is the message
        message = args.slice(0, -1).join(' ');
        remainingArgs = [lastArg];
      } else {
        // Everything is the message, default to 1 time
        message = args.join(' ');
        remainingArgs = [];
      }
    }
  }

  // Helper function to send message with counter
  const sendMessage = (msg: string) => {
    pluginApi.serverCommands?.chat.sendPublicChatMessage({
      textMessageInMarkdownFormat: `[${messageCounter}] ${msg}`,
    });
    messageCounter += 1;
  };

  // Check if it's interval mode
  if (remainingArgs.length >= 2 && remainingArgs[0] === 'interval') {
    const intervalMs = parseFloat(remainingArgs[1]);
    if (Number.isNaN(intervalMs) || intervalMs <= 0) {
      pluginApi.serverCommands?.chat.sendPublicChatMessage({
        textMessageInMarkdownFormat: 'Invalid interval. Use a positive number in milliseconds (e.g., 500 for 500ms).',
      });
      return;
    }

    // Start interval spam (interval is already in milliseconds)
    const intervalId = setInterval(() => {
      sendMessage(message);
    }, intervalMs);

    addSpamInterval(intervalId);

    pluginApi.serverCommands?.chat.sendPublicChatMessage({
      textMessageInMarkdownFormat: `Started spam with interval of ${intervalMs} ms. Use \`/stopspam\` to stop.`,
    });
  } else {
    // Times mode: /spam "message" 5
    const times = remainingArgs.length >= 1 ? parseInt(remainingArgs[0], 10) : 1;
    if (Number.isNaN(times) || times < 1 || times > 100) {
      pluginApi.serverCommands?.chat.sendPublicChatMessage({
        textMessageInMarkdownFormat: 'Invalid number of times. Use a number between 1-100.',
      });
      return;
    }

    // Send messages X times
    for (let i = 0; i < times; i += 1) {
      setTimeout(() => {
        sendMessage(message);
      }, i * 500); // 500ms delay between messages
    }

    pluginApi.serverCommands?.chat.sendPublicChatMessage({
      textMessageInMarkdownFormat: `Sending "${message}" ${times} times with 500ms intervals.`,
    });
  }
};
