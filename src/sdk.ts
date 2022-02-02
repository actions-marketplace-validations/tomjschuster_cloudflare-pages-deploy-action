import fetch from 'node-fetch'
import { CloudFlareApiError } from './errors'
import { ApiResult, Deployment, KnownStageName, Project, StageLogsResult, StageName } from './types'

const CF_BASE_URL = 'https://api.cloudflare.com/client/v4'

export type SdkConfig = {
  accountId: string
  apiKey: string
  email: string
  projectName: string
}

export type Sdk = {
  getProject(name: string): Promise<Project>
  createDeployment(): Promise<Deployment>
  getDeploymentInfo(id: string): Promise<Deployment>
  getStageLogs(deploymentId: string, stageName: StageName): Promise<StageLogsResult>
}

export default function createSdk({ accountId, apiKey, email, projectName }: SdkConfig): Sdk {
  async function fetchCf<T>(path: string, method = 'GET'): Promise<T> {
    const result = (await fetch(`${CF_BASE_URL}${path}`, {
      method,
      headers: {
        'X-Auth-Key': apiKey,
        'X-Auth-Email': email,
      },
    }).then((res) => (res.ok ? res.json() : Promise.reject(res)))) as ApiResult<T>

    if (!result.success) return Promise.reject(new CloudFlareApiError(result))

    return result.result
  }

  function getProject(): Promise<Project> {
    return fetchCf(projectPath(accountId, projectName, ''))
  }

  function createDeployment(): Promise<Deployment> {
    return fetchCf(projectPath(accountId, projectName, '/deployments'), 'POST')
  }

  function getDeploymentInfo(id: string): Promise<Deployment> {
    return fetchCf(projectPath(accountId, projectName, `/deployments/${id}`))
  }

  function getStageLogs(id: string, name: KnownStageName): Promise<StageLogsResult> {
    return fetchCf(projectPath(accountId, projectName, `/deployments/${id}/history/${name}/logs`))
  }

  return {
    getProject,
    createDeployment,
    getDeploymentInfo,
    getStageLogs,
  }
}

function projectPath(accountId: string, projectName: string, path: string): string {
  return `/accounts/${accountId}/pages/projects/${projectName}/${path}`
}