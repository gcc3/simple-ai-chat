import React, { createContext, useContext, useState, useEffect } from "react";
import emitter from "../utils/eventsUtils.js";

const UIContext = createContext();

export const UIProvider = ({ children }) => {
  const [fullscreen, setFullscreen] = useState(false);
  const [enter, setEnter] = useState("");

  useEffect(() => {
    const handleFullscreen = (val) => setFullscreen(val);
    const handleEnter = (val) => setEnter(val);

    emitter.on("ui:set_fullscreen", handleFullscreen);
    emitter.on("ui:set_enter", handleEnter);

    return () => {
      emitter.removeListener("ui:set_fullscreen", handleFullscreen);
      emitter.removeListener("ui:set_enter", handleEnter);
    };
  }, []);

  const value = {
    fullscreen,
    setFullscreen,
    enter,
    setEnter,
  };

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};

export const useUI = () => useContext(UIContext);