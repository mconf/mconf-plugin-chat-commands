import { MODERATOR_ROLE, VIEWER_ROLE } from '../service';
import { CommandExecutor } from './types';

export const debugCommandExecutor: CommandExecutor = ({ pluginApi, currentUser, users }) => {
  const results: string[] = ['🐛 **Debug Information:**', ''];

  // Session Info
  results.push('**Session Details:**');
  results.push(`   - Current User ID: \`${currentUser.userId}\``);
  results.push(`   - User Role: \`${currentUser.role}\``);
  results.push(`   - Is Presenter: \`${currentUser.presenter}\``);
  results.push(`   - Total Users: \`${users.length}\``);

  // Users Breakdown
  const moderators = users.filter((user) => user.role === MODERATOR_ROLE());
  const viewers = users.filter((user) => user.role === VIEWER_ROLE());
  results.push(`   - Moderators: \`${moderators.length}\``);
  results.push(`   - Viewers: \`${viewers.length}\``);

  // Browser & Environment
  results.push('', '**Browser Environment:**');
  results.push(`   - User Agent: \`${navigator.userAgent.split(' ')[0]}\``);
  results.push(`   - Platform: \`${navigator.platform}\``);
  results.push(`   - Language: \`${navigator.language}\``);
  results.push(`   - Online: \`${navigator.onLine}\``);
  results.push(`   - Cookie Enabled: \`${navigator.cookieEnabled}\``);

  // Screen Info
  results.push(`   - Screen: \`${window.screen.width}x${window.screen.height}\``);
  results.push(`   - Available: \`${window.screen.availWidth}x${window.screen.availHeight}\``);
  results.push(`   - Color Depth: \`${window.screen.colorDepth}bit\``);

  // Window Info
  results.push(`   - Viewport: \`${window.innerWidth}x${window.innerHeight}\``);
  results.push(`   - Device Pixel Ratio: \`${window.devicePixelRatio}\``);

  // Timing Info
  results.push('', '**Timing Information:**');
  const now = new Date();
  results.push(`   - Current Time: \`${now.toISOString()}\``);
  results.push(`   - Timezone: \`${Intl.DateTimeFormat().resolvedOptions().timeZone}\``);
  results.push(`   - Timezone Offset: \`${now.getTimezoneOffset()} min\``);

  // Local Storage Info
  results.push('', '**Storage Information:**');
  try {
    const storageUsed = JSON.stringify(localStorage).length;
    results.push(`   - LocalStorage Used: \`${(storageUsed / 1024).toFixed(2)} KB\``);
    results.push(`   - LocalStorage Keys: \`${localStorage.length}\``);
  } catch (error) {
    results.push('   - LocalStorage: `Access Denied`');
  }

  // Send results
  pluginApi.serverCommands?.chat.sendPublicChatMessage({
    textMessageInMarkdownFormat: results.join('\n'),
  });
};
