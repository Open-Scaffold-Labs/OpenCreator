import React from 'react'
import WebsiteManager from '@openscaffold/core/src/components/WebsiteManager'

export default function Website({ user, api }) {
  return <WebsiteManager api={api} appName="Open Creator" serverPort={3012} />
}
