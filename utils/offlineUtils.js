
// Determine command is available offline
export function isOffineCommand(command) {
  if (command === ":help") return 1;
  if (command === ":stats") return 1;
  if (command === ":eval") return 1;
  if (command === ":stream") return 1;
  if (command === ":login") return 0;  // login are not available offline
  if (command === ":logout") return 0;  // logout is not available offline
  if (command === ":log") return 1;
  if (command === ":info") return 1;
  if (command === ":ls") return 0;  // list session is not supported offline
  if (command === ":session") return 0;  // session is not suported offline
  if (command === ":role") return 0;  // role is not available offline
  if (command === ":clear") return 1;
  if (command === ":reset") return 1;
  if (command === ":speak") return 1;
  if (command === ":lang") return 1;
  if (command === ":stop") return 1;
  if (command === ":function") return 1;
  if (command === ":location") return 1;
  if (command === ":voice") return 1;
  if (command === ":system") return 1;
  if (command === ":fullscreen") return 1;
  if (command === ":theme") return 1;
  if (command === ":user") return 0;  // user command is not available offline
  if (command === ":store") return 0;  // store command is not available offline
  if (command === ":search") return 0;  // search command is not available offline
  if (command === ":node") return 0;  // node command is not available offline
  if (command === ":set") return 1;
  if (command === ":generate") return 0;  // generate is a node command, it not available offline
  if (command === ":invite") return 0;  // not available offline
  if (command === ":attach") return 0;  // session attach is not available offline
  if (command === ":use") return 1;
  if (command === ":split") return 1;
  if (command === ":unuse") return 1;
  if (command === ":model") return 1;
  return -1;  // unknown command
}
