// ZoomPanel.tsx
import React from "react";
import { MasterclassContent } from "@/types/masterclass";
import { Calendar, Clock, Video, AlertCircle } from "lucide-react";

interface ZoomPanelProps {
  content: MasterclassContent;
  hasAccess: boolean;
  processing: boolean;
}

const ZoomPanel: React.FC<ZoomPanelProps> = ({
  content,
  hasAccess,
  processing,
}) => {
  // If required details are missing
  if (!content.zoom_meeting_id || !content.scheduled_date) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden p-6">
        <div className="flex items-start gap-4">
          <AlertCircle className="w-8 h-8 text-yellow-500" />
          <div>
            <h3 className="text-lg font-semibold">Session Details Unavailable</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              The organizer has not provided complete details for this session yet. Please check back later.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const startTime = new Date(content.scheduled_date);
  const isSessionLive = startTime <= new Date();
  const zoomJoinUrl =
    content.zoom_link || `https://zoom.us/j/${content.zoom_meeting_id}`;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden p-6">
      <h2 className="text-2xl font-bold mb-2">{content.title}</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        {content.description || "Join the live session at the scheduled time."}
      </p>

      {/* Meeting Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 border-t border-b border-gray-200 dark:border-gray-700 py-4">
        <div className="flex items-center gap-2">
          <Video className="w-5 h-5 text-gray-500" />
          <div>
            <p className="text-sm text-gray-500">Meeting ID</p>
            <p className="font-semibold">{content.zoom_meeting_id}</p>
          </div>
        </div>

        {content.zoom_passcode && (
          <div className="flex items-center gap-2">
            <p className="text-sm text-gray-500">Passcode:</p>
            <p className="font-semibold">{content.zoom_passcode}</p>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-500" />
          <div>
            <p className="text-sm text-gray-500">Date</p>
            <p className="font-semibold">{startTime.toLocaleDateString()}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-gray-500" />
          <div>
            <p className="text-sm text-gray-500">Time</p>
            <p className="font-semibold">{startTime.toLocaleTimeString()}</p>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="mt-4">
        {hasAccess ? (
          <div>
            <a
              href={zoomJoinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`w-full flex items-center justify-center px-6 py-3 rounded-lg font-semibold transition text-center ${
                isSessionLive
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              }`}
            >
              {isSessionLive ? "Join Live Session" : "View Session Link"}
            </a>

            {!isSessionLive && (
              <p className="text-xs text-center text-gray-500 mt-2">
                The session has not started yet. The link will be active at the scheduled time.
              </p>
            )}
          </div>
        ) : (
          <div className="text-center text-gray-600 dark:text-gray-400 text-sm">
            Enroll in the masterclass to access this session.
          </div>
        )}
      </div>
    </div>
  );
};

export default ZoomPanel;
