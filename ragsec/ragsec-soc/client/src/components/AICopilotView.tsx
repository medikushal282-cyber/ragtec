import React from "react";
import { MitigationCopilotView, MitigationCopilotViewProps } from "./MitigationCopilotView";

export { MitigationCopilotView };
export type { MitigationCopilotViewProps };

export const AICopilotView: React.FC<MitigationCopilotViewProps> = (props) => {
  return <MitigationCopilotView {...props} />;
};

export default AICopilotView;
