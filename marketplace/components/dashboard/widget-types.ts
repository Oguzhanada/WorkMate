export type DashboardWidgetRow = {
  id: string;
  user_id: string;
  widget_type: string;
  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  settings: Record<string, unknown>;
  created_at: string;
};
