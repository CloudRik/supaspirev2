import { useState, useEffect, useRef } from "react";
import { AppShell } from "@/components/AppShell";

export default function SupaspirePage() {
  const [activeTab, setActiveTab] = useState<string>("Overview");
  const [activeDbSubTab, setActiveDbSubTab] = useState<string>("Schema Visualizer");
  const [activeAuthSubTab, setActiveAuthSubTab] = useState<string>("Users");
  const [activeStorageSubTab, setActiveStorageSubTab] = useState<string>("Buckets");
  const [activeRealtimeSubTab, setActiveRealtimeSubTab] = useState<string>("Inspector");
  const [activeFunctionsSubTab, setActiveFunctionsSubTab] = useState<string>("Functions");
  const [hasProject, setHasProject] = useState<boolean>(() => {
    const saved = localStorage.getItem("supaspire-project");
    return !!saved;
  });

  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Listen for messages from the Supaspire iframe (e.g. project status changes)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Check if message is from our iframe's origin (or any during dev)
      if (event.data && typeof event.data === "object") {
        if (event.data.type === "SUPASPIRE_PROJECT_STATUS") {
          setHasProject(event.data.hasProject);
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Sync activeTab to iframe when activeTab changes
  useEffect(() => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type: "SUPASPIRE_TAB_CHANGE", tab: activeTab },
        "*"
      );
    }
  }, [activeTab]);

  // Sync subTabs to iframe when subTabs change
  useEffect(() => {
    let sub = "";
    if (activeTab === "Database") sub = activeDbSubTab;
    else if (activeTab === "Authentication") sub = activeAuthSubTab;
    else if (activeTab === "Storage") sub = activeStorageSubTab;
    else if (activeTab === "Real-time") sub = activeRealtimeSubTab;
    else if (activeTab === "Functions") sub = activeFunctionsSubTab;

    if (iframeRef.current && iframeRef.current.contentWindow && sub) {
      iframeRef.current.contentWindow.postMessage(
        { type: "SUPASPIRE_SUBTAB_CHANGE", subTab: sub },
        "*"
      );
    }
  }, [
    activeTab,
    activeDbSubTab,
    activeAuthSubTab,
    activeStorageSubTab,
    activeRealtimeSubTab,
    activeFunctionsSubTab
  ]);

  // Handle load event to send initial tab states to iframe
  const handleIframeLoad = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      // Send project status
      iframeRef.current.contentWindow.postMessage(
        { type: "SUPASPIRE_TAB_CHANGE", tab: activeTab },
        "*"
      );
      
      let sub = "";
      if (activeTab === "Database") sub = activeDbSubTab;
      else if (activeTab === "Authentication") sub = activeAuthSubTab;
      else if (activeTab === "Storage") sub = activeStorageSubTab;
      else if (activeTab === "Real-time") sub = activeRealtimeSubTab;
      else if (activeTab === "Functions") sub = activeFunctionsSubTab;

      if (sub) {
        iframeRef.current.contentWindow.postMessage(
          { type: "SUPASPIRE_SUBTAB_CHANGE", subTab: sub },
          "*"
        );
      }
    }
  };

  let subTab = "";
  let setSubTab = (tab: string) => {};
  if (activeTab === "Database") {
    subTab = activeDbSubTab;
    setSubTab = setActiveDbSubTab;
  } else if (activeTab === "Authentication") {
    subTab = activeAuthSubTab;
    setSubTab = setActiveAuthSubTab;
  } else if (activeTab === "Storage") {
    subTab = activeStorageSubTab;
    setSubTab = setActiveStorageSubTab;
  } else if (activeTab === "Real-time") {
    subTab = activeRealtimeSubTab;
    setSubTab = setActiveRealtimeSubTab;
  } else if (activeTab === "Functions") {
    subTab = activeFunctionsSubTab;
    setSubTab = setActiveFunctionsSubTab;
  }

  return (
    <AppShell 
      activeNav="Supaspire" 
      activeSubItem={activeTab} 
      onSubItemChange={setActiveTab}
      hasProject={hasProject}
      activeSubTab={subTab}
      onSubTabChange={setSubTab}
    >
      <div className="w-full h-[calc(100vh-64px)] overflow-hidden bg-white">
        <iframe
          ref={iframeRef}
          src="http://localhost:5175"
          className="w-full h-full border-none"
          title="Supaspire Services"
          onLoad={handleIframeLoad}
        />
      </div>
    </AppShell>
  );
}
