import {
  flow,
  Instance,
  SnapshotOut,
  types,
} from "mobx-state-tree"

import { withCreatorsStore } from "../extensions"
import {
  StatisticsSupportedCreatorModel,
} from "./statistics-supported-creator"
import {
  StatisticsSupportedDayModel,
} from "./statistics-supported-day"
import {
  StatisticsSupportedContent,
  StatisticsSupportedContentModel,
} from "./statistics-supported-content"
import {
  StatisticsWeekModel,
} from "./statistics-week"

import { StatisticsSupportedResult } from "../../services/api"
import { logError } from "../../utils/error"

/**
 * Weekly model for supported statistics
 */
export const StatisticsSupportedWeekModel = StatisticsWeekModel
  .named("StatisticsSupportedWeek")
  .props({
    worksCount: types.optional(types.number, 0),
    likeAmount: types.optional(types.number, 0.0),
    likesCount: types.optional(types.number, 0),
    creators: types.array(StatisticsSupportedCreatorModel),
    days: types.array(StatisticsSupportedDayModel),
  })
  .views(self => ({
    get creatorsCount() {
      return self.creators.length
    },
  }))
  .extend(withCreatorsStore)
  .actions(self => ({
    fetchData: flow(function * () {
      self.setFetching()
      try {
        const result: StatisticsSupportedResult =
          yield self.env.likeCoAPI.fetchSupportedStatistics(
            self.getStartDateWithLimit().valueOf(),
            self.getEndDate().valueOf()
          )
        if (result.kind !== "ok") {
          throw new Error("STATS_FETCH_SUPPORTED_FAILED")
        }

        self.worksCount = result.data.workCount
        self.likesCount = result.data.likeCount
        self.likeAmount = result.data.LIKE
        self.creators.replace(result.data.all.map(({ likee, workCount, LIKE, likeCount }) => {
          const creator = StatisticsSupportedCreatorModel.create({
            likerID: likee,
            likeAmount: LIKE,
            likesCount: likeCount,
            worksCount: workCount,
          }, self.env)
          if (likee) {
            creator.setInfo(self.createCreatorFromLikerID(likee))
          }
          return creator
        }))
        self.days.replace(
          result.data.daily.map((rawContents, i) => {
            const dayID = `${self.startTs}-${i + 1}`
            const day = StatisticsSupportedDayModel.create({ dayID }, self.env)
            if (rawContents && rawContents.length > 0) {
              const likees = new Set<string>()
              const contents: StatisticsSupportedContent[] = []
              rawContents.forEach(({ likee, sourceURL: url, LIKE, likeCount }) => {
                likees.add(likee)
                const content = StatisticsSupportedContentModel.create({
                  id: url,
                  likeAmount: LIKE,
                  likesCount: likeCount,
                }, self.env)
                if (url) {
                  content.setInfo(self.createContentFromURL(url))
                }
                contents.push(content)
              })
              day.setTotalCreatorsCount(likees.size)
              day.setContents(contents)
            }
            return day
          })
        )
      } catch (error) {
        logError(error.message)
      } finally {
        self.setFetched()
      }
    }),
  }))

type StatisticsSupportedWeekType = Instance<typeof StatisticsSupportedWeekModel>
export interface StatisticsSupportedWeek extends StatisticsSupportedWeekType {}
type StatisticsSupportedWeekSnapshotType = SnapshotOut<typeof StatisticsSupportedWeekModel>
export interface StatisticsSupportedWeekSnapshot extends StatisticsSupportedWeekSnapshotType {}
