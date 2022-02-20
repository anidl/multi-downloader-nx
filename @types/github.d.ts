export type GithubTag = {
  name: string,
  zipball_url: string,
  tarball_url: string,
  commit: {
    sha: string,
    url: string
  },
  node_id: string
}

export interface TagCompare {
  url:               string;
  html_url:          string;
  permalink_url:     string;
  diff_url:          string;
  patch_url:         string;
  base_commit:       BaseCommitClass;
  merge_base_commit: BaseCommitClass;
  status:            string;
  ahead_by:          number;
  behind_by:         number;
  total_commits:     number;
  commits:           BaseCommitClass[];
  files:             File[];
}

export interface BaseCommitClass {
  sha:          string;
  node_id:      string;
  commit:       BaseCommitCommit;
  url:          string;
  html_url:     string;
  comments_url: string;
  author:       BaseCommitAuthor;
  committer:    BaseCommitAuthor;
  parents:      Parent[];
}

export interface BaseCommitAuthor {
  login:               string;
  id:                  number;
  node_id:             string;
  avatar_url:          string;
  gravatar_id:         string;
  url:                 string;
  html_url:            string;
  followers_url:       string;
  following_url:       string;
  gists_url:           string;
  starred_url:         string;
  subscriptions_url:   string;
  organizations_url:   string;
  repos_url:           string;
  events_url:          string;
  received_events_url: string;
  type:                string;
  site_admin:          boolean;
}

export interface BaseCommitCommit {
  author:        PurpleAuthor;
  committer:     PurpleAuthor;
  message:       string;
  tree:          Tree;
  url:           string;
  comment_count: number;
  verification:  Verification;
}

export interface PurpleAuthor {
  name:  string;
  email: string;
  date:  string;
}

export interface Tree {
  sha: string;
  url: string;
}

export interface Verification {
  verified:  boolean;
  reason:    string;
  signature: string;
  payload:   string;
}

export interface Parent {
  sha:      string;
  url:      string;
  html_url: string;
}

export interface File {
  sha:          string;
  filename:     string;
  status:       string;
  additions:    number;
  deletions:    number;
  changes:      number;
  blob_url:     string;
  raw_url:      string;
  contents_url: string;
  patch:        string;
}
