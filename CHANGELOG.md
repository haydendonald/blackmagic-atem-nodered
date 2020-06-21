# Changelog

# 2.2.8
### Bug fixes
* Fixed tally not sending updates to output

# 2.2.6
### Bug fixes
* Fixed a crash event
* messageCallbacks bug showed it's face again

# 2.2.3
### Revert
* Removed feature added in 2.2.2 as this didn't work correctly

# 2.2.2
### Bug fixes
* Added check to see if the tallys have actually updated. If not don't send out the tally updates

# 2.2.0
### Features
* Added send time setting to disable the time command being sent to the output as it can be a bit annoying
* The tallying system has been adjusted to run via a tally command
### Bug fixes
* Fixed a bug where the upstream keyers were having their config cleared due to a typo

## 2.1.1
### Bug fixes
* Fixed a bug where a crash would occur when updating the tally values on a keyer update

## 2.1.0
### Bug fixes
* Fixed a critical bug which was causing a crash in the multiViewerInput when finding the input source
* Fixed a bug which causes a crash occasionally on redeploy in the preview and program commands

## 2.0.0
### Features
* Added multiViewerInput support

## 1.9.0
### Bug fixes
* Fixed a major bug where adding multiple ATEMs would cause overlapping and invalid memory

## 1.8.0
### Features
* Added audioMixerInput support
* Added audioMixerMonitor support

## 1.7.3
### Bug fixes
* Attempted fix to the camera not stating gain values correctly

## 1.7.2
### Bug fixes
* Changed the iris flag from 0x03 to 0x02 as the ATEM seems to have updated this value

## 1.7.1
### Features
* Added cameraControl command. This allows for control of the cameras values

### Bug fixes
* Fixed some console statements that were for debugging

## 1.6.0
### Features
* Added superSourceBox command. This allows for control of the boxes in the super source.

### Bug fixes
* None