
// Determine command is available offline
export function isOffineCommand(command) {
  if (command === ":help") return true;
  if (command === ":stats") return true;
  if (command === ":eval") return true;
  if (command === ":stream") return true;
  if (command === ":login") return false;  // login are not available offline
  if (command === ":logout") return false;  // logout is not available offline
  if (command === ":log") return true;
  if (command === ":info") return true;
  if (command === ":ls") return false;  // list session is not supported offline
  if (command === ":session") return false;  // session is not suported offline
  if (command === ":role") return false;  // role is not available offline
  if (command === ":clear") return true;
  if (command === ":reset") return true;
  if (command === ":speak") return true;
  if (command === ":lang") return true;
  if (command === ":stop") return true;
  if (command === ":function") return true;
  if (command === ":location") return true;
  if (command === ":voice") return true;
  if (command === ":system") return true;
  if (command === ":fullscreen") return true;
  if (command === ":theme") return true;
  if (command === ":user") return false;  // user command is not available offline
  if (command === ":store") return false;  // store command is not available offline
  if (command === ":search") return false;  // search command is not available offline
  if (command === ":node") return false;  // node command is not available offline
  if (command === ":set") return true;
  if (command === ":generate") return false;  // generate is a node command, it not available offline
  if (command === ":invite") return false;  // not available offline
  if (command === ":attach") return false;  // session attach is not available offline
  if (command === ":use") return true;
  if (command === ":split") return true;
  if (command === ":unuse") return true;
  if (command === ":model") return true;
}
