export default async function voice(args) {
  const command = args[0];

  if (command === "ls" || command === "list") {
    const voices = window.speechSynthesis.getVoices();
    let langVoiceList = [];
    for (let i = 0; i < voices.length ; i++) {
      if (voices[i].lang === localStorage.getItem("lang")) {
        console.log(`Voice ${i+1}: ${voices[i].name}, ${voices[i].lang}`);
        langVoiceList.push(voices[i].name);
      }
    }
    return "\\" + langVoiceList.join(" \\");
  }
  
  if (command === "use") {
    if (args.length != 2) {
      return "Usage: :voice use [voice_name]\n"
    }

    if (!args[1].startsWith("\"") || !args[1].endsWith("\"")) {
      return "Voice name must be quoted with double quotes.";
    }

    const voiceName = args[1].slice(1, -1);

    // find voice and set
    const voice = findVoice(voiceName);
    if (voice) {
      localStorage.setItem("voice", voiceName);
      return "Voice is set to " + voiceName + ".";
    } else {
      return "Voice not found."
    }
  }

  return "Usage: :voice [ls|list]" + "\n" +
         "       :voice use [voice_name]" + "\n";
}

function findVoice(voiceName) {
  const voices = window.speechSynthesis.getVoices();
  for (let i = 0; i < voices.length ; i++) {
    if (voices[i].lang === localStorage.getItem("lang") && voices[i].name === voiceName) {
      return voices[i]
    }
  }
  return null;
}