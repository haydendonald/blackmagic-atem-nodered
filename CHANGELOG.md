# Changelog

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