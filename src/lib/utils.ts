import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Extracts the base video name from processed video filenames for analytics lookup
 * Handles various processed video filename patterns including enhanced analytics
 */
export function extractVideoBaseName(videoName: string): string {
  return videoName
    .replace(/\.mp4$/, '') // Remove .mp4 extension
    .replace(/^api_generated_/, '') // Remove api_generated_ prefix
    .replace(/^analyzed_/, '') // Remove analyzed_ prefix
    .replace(/^overlayed_/, '') // Remove overlayed_ prefix
    .replace(/^enhanced_replay_/, '') // Remove enhanced_replay_ prefix
    .replace(/^acl_risk_overlay_/, '') // Remove acl_risk_overlay_ prefix
    .replace(/^fixed_overlayed_analytics_/, '') // Remove fixed_overlayed_analytics_ prefix
    .replace(/^downloaded_overlayed_/, '') // Remove downloaded_overlayed_ prefix
    .replace(/^enhanced_analyzed_temp_\d+_/, '') // Remove enhanced_analyzed_temp_{timestamp}_ prefix
    .replace(/^h264_analyzed_temp_\d+_/, '') // Remove h264_analyzed_temp_{timestamp}_ prefix
    .replace(/^api_generated_overlayed_/, '') // Remove api_generated_overlayed_ prefix
    .replace(/_\d+$/, '') // Remove timestamp suffix like _1756828395
    .replace(/\s*\([^)]*\)$/, ''); // Remove any text in parentheses at the end
}
