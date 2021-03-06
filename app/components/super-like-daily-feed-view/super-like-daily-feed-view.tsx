import * as React from "react"
import { observer } from "mobx-react"

import { SuperLikeContentList } from "../../components/content-list"

import { SuperLikeDailyFeedViewProps } from "./super-like-daily-feed-view.props"
import { wrapScrollViewShadow } from "../wrap-scrollview-shadow"

const WrappedSuperLikeContentList = wrapScrollViewShadow(SuperLikeContentList)

@observer
export class SuperLikeDailyFeedView extends React.Component<
  SuperLikeDailyFeedViewProps,
  {}
> {
  componentDidMount() {
    this.props.feed.fetch()
  }

  render() {
    const { feed } = this.props
    return (
      <WrappedSuperLikeContentList
        data={feed.items}
        emptyTx="readerScreen.emptyLabel"
        isLoading={feed.isFetching}
        hasFetched={!feed.isFetching}
        hasFetchedAll={feed.hasFetchedAll()}
        onPressUndoUnfollowButton={this.props.onPressUndoUnfollowButton}
        onPressItem={this.props.onPressItem}
        onToggleBookmark={this.props.onToggleBookmark}
        onToggleFollow={this.props.onToggleFollow}
        style={this.props.style}
      />
    )
  }
}
