/**
 * An enumeration of possible status values for the speech-to-text service.
 *
 * @enum {string}
 * @readonly
 * @property {string} GettingToken - The speech-to-text service is in the process of obtaining an authentication token.
 * @property {string} TokenReceived - The speech-to-text service has received an authentication token and is ready to start.
 * @property {string} Configuring - The speech-to-text service is in the process of configuring.
 * @property {string} Starting - The speech-to-text service is starting up.
 * @property {string} Started - The speech-to-text service has started and is ready to receive audio input.
 * @property {string} Recognizing - The speech-to-text service is currently processing audio input and attempting to recognize speech.
 * @property {string} Recognized - The speech-to-text service has recognized speech.
 * @property {string} NoSpeechDetected - The speech-to-text service has not detected any speech.
 * @property {string} Stopping - The speech-to-text service is in the process of stopping.
 * @property {string} Stopped - The speech-to-text service has stopped and is no longer processing audio input.
 * @property {string} Cancelling - The speech-to-text service is in the process of cancelling a recognition request.
 * @property {string} Cancelled - The speech-to-text service has cancelled a recognition request.
 * @property {string} Error - The speech-to-text service has encountered an error.
 */
export enum SpeechToTextStatus {
  GettingToken = 'gettingToken',
  TokenReceived = 'tokenReceived',
  Configuring = 'configuring',
  Starting = 'starting',
  Started = 'started',
  Recognizing = 'recognizing',
  Recognized = 'recognized',
  NoSpeechDetected = 'noSpeechDetected',
  Stopping = 'stopping',
  Stopped = 'stopped',
  Canceling = 'canceling',
  Canceled = 'canceled',
  Error = 'error',
}
