import { createClient } from '@supabase/supabase-js';

interface TrialInstallation {
    id: string;
    device_fingerprint: string;
    extension_id: string;
    chrome_profile_id: string | null;
    install_time: Date;
    last_active: Date;
    user_id?: string;  // Optional, linked when user logs in
    status: 'active' | 'expired' | 'converted';
    ip_address: string;
  }

const supabase = createClient('YOUR_SUPABASE_URL', 'YOUR_SUPABASE_ANON_KEY');

export class TrialManager {
  private static TRIAL_DURATION_DAYS = 14;

  static async generateDeviceFingerprint(): Promise<string> {
    const characteristics = {
      screen: {
        width: window.screen.width,
        height: window.screen.height,
        colorDepth: window.screen.colorDepth
      },
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      userAgent: navigator.userAgent
    };

    const text = JSON.stringify(characteristics);
    const msgBuffer = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  static async initializeTrial(): Promise<{ isValid: boolean; daysRemaining: number }> {
    const deviceFingerprint = await this.generateDeviceFingerprint();
    const extensionId = chrome.runtime.id;

    // Check for existing trial
    const { data: existingTrials, error: searchError } = await supabase
      .from('trial_installations')
      .select('*')
      .or(`device_fingerprint.eq.${deviceFingerprint},extension_id.eq.${extensionId}`)
      .order('install_time', { ascending: false });

    if (searchError) {
      console.error('Error checking for existing trial:', searchError);
      return { isValid: false, daysRemaining: 0 };
    }

    // If recent trial exists, validate it
    if (existingTrials && existingTrials.length > 0) {
      const mostRecentTrial = existingTrials[0];
      return this.validateTrial(mostRecentTrial);
    }

    // Create new trial
    const { data: ipResponse } = await fetch('https://api.ipify.org?format=json')
      .then(res => res.json());

    const newTrial: Omit<TrialInstallation, 'id'> = {
      device_fingerprint: deviceFingerprint,
      extension_id: extensionId,
      chrome_profile_id: await this.getChromeProfileId(),
      install_time: new Date(),
      last_active: new Date(),
      status: 'active',
      ip_address: ipResponse.ip
    };

    const { data: trial, error: insertError } = await supabase
      .from('trial_installations')
      .insert([newTrial])
      .select()
      .single();

    if (insertError) {
      console.error('Error creating new trial:', insertError);
      return { isValid: false, daysRemaining: 0 };
    }

    return { isValid: true, daysRemaining: this.TRIAL_DURATION_DAYS };
  }

  static async validateTrial(trial: TrialInstallation): Promise<{ isValid: boolean; daysRemaining: number }> {
    const now = new Date();
    const trialAge = (now.getTime() - new Date(trial.install_time).getTime()) / (1000 * 60 * 60 * 24);
    
    // Update last active timestamp
    await supabase
      .from('trial_installations')
      .update({ last_active: now })
      .eq('id', trial.id);

    if (trialAge >= this.TRIAL_DURATION_DAYS) {
      await supabase
        .from('trial_installations')
        .update({ status: 'expired' })
        .eq('id', trial.id);
      
      return { isValid: false, daysRemaining: 0 };
    }

    return {
      isValid: true,
      daysRemaining: Math.max(0, this.TRIAL_DURATION_DAYS - Math.floor(trialAge))
    };
  }

  static async linkUserToTrial(userId: string): Promise<void> {
    const deviceFingerprint = await this.generateDeviceFingerprint();
    
    await supabase
      .from('trial_installations')
      .update({ 
        user_id: userId,
        status: 'converted'
      })
      .eq('device_fingerprint', deviceFingerprint);
  }

  private static async getChromeProfileId(): Promise<string | null> {
    try {
      const storageKey = 'chrome_profile_id';
      const result = await chrome.storage.sync.get(storageKey);
      if (result[storageKey]) {
        return result[storageKey];
      }
      const newId = crypto.randomUUID();
      await chrome.storage.sync.set({ [storageKey]: newId });
      return newId;
    } catch (e) {
      return null;
    }
  }
}
