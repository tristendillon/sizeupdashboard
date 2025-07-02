import { RoutineContext } from '@/context/routineContext'
import { BaseRoutine } from './routine'
import { PostHydrant } from '@sizeupdashboard/convex/api/schema'
import { config } from '@/config'
import { api } from '@sizeupdashboard/convex/api/_generated/api'
export interface FirstDueHydrant {
  facility_code: string
  id: number
  client_code: string
  hydrant_type_code: string
  year: string | null
  fort_lauderdale_owner_code: string | null
  latitude: string
  longitude: string
  hydrant_status_code: string
  inspected_at: string
  area_ids_cache: string
  static_pressure: string
  residual_pressure: string
  residual_flow_rate: string
  hydrant_type_name: string
  address: string | null
  apparatus: string | null
  closest_address: string | null
  fire_zone: string | null
  inspected_by: string
  hydrant_zone: string | null
  xref_id: string | null
  base_color_code: string
  manufacturer: string
  num_outlet: number
  steamer_port: string
  outlet_size2: string
  outlet_size3: string
  source: string | null
  location: string
  cistern_capacity_gallons: string | null
  main_size: string | null
  barrel_size: string | null
  last_flow_tested_at: string
  water_department: string
  model: string | null
  notes: string | null
  is_private: boolean
  cistern_capacity_liters: string | null
  calculated_flow_rate: string
  fire_district: string | null
  valve_location: string | null
  placement: string | null
  fire_station: string | null
  shift: string | null
  assigned_user: string | null
  annual_maintenance: string | null
  reason_out_of_service: string | null
  hydrant_type_bg_color: string | null
  icon_file_path: string | null
  agency_name: string
  flow_hydrant_one: string
  flow_hydrant_two: string
  pitot_gauge_one: number
  pitot_gauge_two: number
  team_id: number
  assigned_team: string
  responsible_occupancy: string | null
  pressure_zone: string | null
  flowed_by: string
}

const ROUTINE_NAME = 'Hydrants'
const INTERVAL = 1000 * 60 * 60 * 24

export class HydrantsRoutine extends BaseRoutine {
  readonly interval = INTERVAL

  constructor(context: typeof RoutineContext) {
    super(ROUTINE_NAME, context)
  }
  protected parseFirstDueHydrant(hydrant: FirstDueHydrant): PostHydrant {
    return {
      hydrantId: hydrant.id,
      latitude: parseFloat(hydrant.latitude),
      longitude: parseFloat(hydrant.longitude),
      hydrantStatusCode: hydrant.hydrant_status_code,
      calculatedFlowRate: hydrant.calculated_flow_rate,
      hydrantTypeName: hydrant.hydrant_type_name,
      hydrantTypeCode: hydrant.hydrant_type_code,
      notes: hydrant.notes ?? '',
      hydrantTypeBgColor: hydrant.hydrant_type_bg_color ?? '',
      iconFilePath: hydrant.icon_file_path ?? '',
      address: hydrant.address ?? '',
      closestAddress: hydrant.closest_address ?? '',
      xrefId: hydrant.xref_id ?? '',
      numOutlet: hydrant.num_outlet ?? 0,
      year: hydrant.year ?? '',
    }
  }

  protected async getHydrants(): Promise<FirstDueHydrant[]> {
    const response = await fetch(`${config.firstdueApiUrl}/get-hydrants`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.firstdueApiKey}`,
      },
    })
    if (!response.ok) {
      this.ctx.logger.error(`Failed to fetch hydrants: ${response.statusText}`)
      return []
    }
    const data = await response.json()
    return data
  }

  protected async execute(): Promise<void> {
    const hydrants = await this.getHydrants()
    const parsedHydrants = hydrants.map((hydrant) =>
      this.parseFirstDueHydrant(hydrant)
    )
    if (hydrants.length > 0) {
      const createdHydrants = await this.ctx.client.mutation(
        api.hydrants.createHydrants,
        {
          hydrants: parsedHydrants,
        }
      )
      this.ctx.logger.info(`Synced ${createdHydrants.length} hydrants`)
    }
    const newDate = new Date()
    const lastSync = await this.ctx.client.mutation(
      api.sync.setLastHydrantSync,
      {
        date: newDate.getTime(),
      }
    )
    this.ctx.logger.info(
      `Set last hydrant sync to ${newDate.toLocaleString('en-US', {
        timeZone: config.timezone,
      })}`
    )
  }
}
