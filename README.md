# SecurityVideos
UI for Security Video Playback

This project is the static web site which displays security videos uploaded to S3 and cataloged to DynamoDB using the sendftpfilestos3 repository found here:
https://github.com/briantroy/sendftpfilestos3

Provided one can replicate those APIs (implemented via Lambda functions) this UI can be used standalone.

# UI Features
The Web UI currently allows a Google user to log in/log out and view the timeline of uploaded security camera videos or the most recent videos by individual camera name.

The UI is 100% reponsive and has media queries built in to allow clean playback on all/most mobile devices. The user can also select HD playback or the lower-res mobile version (if enabled).

