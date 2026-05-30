import type { PrinterSnapshot, TransportClient } from './types'

function nowIso(): string {
  return new Date().toISOString()
}

export function createMockClient(): TransportClient {
  return {
    async fetchSnapshot(): Promise<PrinterSnapshot> {
      return {
        source: 'mock',
        connection: 'online',
        wifiSsid: 'TreeD-Lab',
        ipAddress: '192.168.0.21',
        state: 'ready',
        toolheadX: 125,
        toolheadY: 125,
        toolheadZ: 12.4,
        homedAxes: 'xyz',
        extruderTemp: 215,
        bedTemp: 58,
        modelFanPercent: 78,
        updatedAt: nowIso(),
        message: 'TreeD V2 runtime mock',
        hardware: {
          marker: 'treed-v2',
          profile: 'treed_v2_corexy_v1',
          host: 'Rock Pi / Armbian Debian 12',
          mainMcu: 'Octopus Pro CAN',
          toolheadMcu: 'EBB42 CAN',
          probe: 'Eddy Duo CAN',
          model: 'TreeD V2',
          revision: 'mock',
        },
        capabilities: {
          print: true,
          motion: true,
          thermal: true,
          fan: true,
          filament: true,
          console: true,
          eddy: true,
          shaper: true,
          motionTest: true,
          power: false,
          network: false,
          cloud: false,
          updates: false,
          systemPower: false,
          camera: false,
          serviceCommands: true,
        },
        printJob: {
          filename: '',
          filePath: null,
          state: 'ready',
          message: 'Ready for local mock print',
          progress: 0,
          progressPercent: 0,
          totalDurationSec: 0,
          printDurationSec: 0,
          filamentUsedMm: 0,
          currentLayer: null,
          totalLayer: null,
          isPaused: false,
          isActive: false,
        },
        files: {
          type: 'virtual_sdcard',
          path: null,
          progress: 0,
          isActive: false,
          filePosition: 0,
          fileSize: null,
        },
        toolhead: {
          rawX: 125,
          rawY: 125,
          rawZ: 12.4,
          rawE: 0,
          printOffsetX: 0,
          printOffsetY: 65,
          homedAxes: 'xyz',
          coordinateMode: 'raw',
        },
        geometry: {
          toolhead: { x: 125, y: 125, z: 12.4, e: 0 },
          gcode: { x: 125, y: 125, z: 12.4, e: 0 },
          homingOrigin: { x: 0, y: 0, z: 0, e: 0 },
          absoluteCoordinates: true,
          absoluteExtrude: false,
          speedFactor: 1,
          speed: 0,
          extrudeFactor: 1,
        },
        macros: {
          available: [],
          values: {},
        },
        printFiles: [],
        v2: {
          branch: 'treed-v2',
          profile: 'treed_v2_corexy_v1',
          eddy: {
            status: 'ready',
            autosaveEnabled: true,
            autosavePending: false,
          },
        },
      }
    },
  }
}
