/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Memory {
  id: string;
  title: string;
  date: string;
  description: string;
  caption: string;
  image: string;
  customImage?: string; // Base64 or uploaded blob url from user
}

export type PageId = 'welcome' | 'voicenote' | 'cake' | 'timeline' | 'messagejar';

export interface WishMessage {
  id: string;
  text: string;
  date: string;
  starX: number; // Star coordinate X (percentage)
  starY: number; // Star coordinate Y (percentage)
  size: number; // star scale size
}
