const percent = (part, total) => total > 0 ? Math.round((part / total) * 1000) / 10 : 0

export function buildDashboardComparisons(today, realtime, channelSlices) {
  const channelTotal = channelSlices.reduce((sum, channel) => sum + channel.value, 0)

  return {
    organizations: {
      total: today.orgs,
      active: today.activeOrgs,
      inactive: Math.max(0, today.orgs - today.activeOrgs),
      activeRate: percent(today.activeOrgs, today.orgs),
    },
    agents: {
      total: today.agents,
      online: today.onlineAgents,
      offline: Math.max(0, today.agents - today.onlineAgents),
      busy: realtime.busyAgents,
      idle: realtime.idleAgents,
      onlineRate: percent(today.onlineAgents, today.agents),
      loadRate: percent(realtime.busyAgents, today.onlineAgents),
      idleRate: percent(realtime.idleAgents, today.onlineAgents),
    },
    channels: [...channelSlices]
      .sort((a, b) => b.value - a.value)
      .map((channel, index) => ({
        ...channel,
        rank: index + 1,
        share: percent(channel.value, channelTotal),
      })),
  }
}

export function buildOrganizationDashboardComparisons(today, realtime) {
  const totalConversations = today.todayConversations
  const aiHandled = Math.min(today.aiHandled, totalConversations)
  const totalAgents = realtime.totalAgents ?? realtime.onlineAgents

  return {
    conversations: {
      total: totalConversations,
      aiHandled,
      humanHandled: Math.max(0, totalConversations - aiHandled),
      aiRate: percent(aiHandled, totalConversations),
      handling: today.handling,
      queued: today.queued,
    },
    agents: {
      total: totalAgents,
      online: realtime.onlineAgents,
      offline: Math.max(0, totalAgents - realtime.onlineAgents),
      busy: realtime.busyAgents,
      idle: realtime.idleAgents,
      onlineRate: percent(realtime.onlineAgents, totalAgents),
      loadRate: percent(realtime.busyAgents, realtime.onlineAgents),
      idleRate: percent(realtime.idleAgents, realtime.onlineAgents),
    },
  }
}
