
import { Injectable, Autowired } from '@ali/common-di';
import { FileTreeAPI, IFileTreeItem, FileStat } from '../common/file-tree.defination';
import { URI } from '@ali/ide-core-common';
import { FileServiceClient } from '@ali/ide-file-service/lib/browser/file-service-client';
import { LabelService, SYMBOLIC_ICON } from '@ali/ide-core-browser/lib/services';

let id = 0;

@Injectable()
export class FileTreeAPIImpl implements FileTreeAPI {

  @Autowired()
  private fileServiceClient: FileServiceClient;

  @Autowired()
  labelService: LabelService;

  async getFiles(path: string, parent?: IFileTreeItem | undefined) {
    const files: any = await this.fileServiceClient.getFileStat(path);
    const result = await this.fileStat2FileTreeItem(files, parent);
    return [ result ];
  }

  async createFile(uri: string) {
    await this.fileServiceClient.createFile(uri);
  }

  async createFileFolder(uri: string) {
    await this.fileServiceClient.createFolder(uri);
  }

  async deleteFile(uri: URI) {
    await this.fileServiceClient.delete(uri.toString());
  }

  async fileStat2FileTreeItem(filestat: FileStat, parent: IFileTreeItem | undefined ): Promise<IFileTreeItem> {
    const result: IFileTreeItem = {
      id: 0,
      uri: new URI(''),
      name: '',
      filestat: {
        isDirectory: false,
        lastModification: 0,
        uri: '',
      },
      parent,
      depth: 0,
      order: 0,
    };
    const uri = new URI(filestat.uri);
    let icon;
    if (filestat.isSymbolicLink) {
      icon = SYMBOLIC_ICON;
    } else {
      icon = await this.labelService.getIcon(uri);
    }
    const name = this.labelService.getName(uri);
    if (filestat.isDirectory && filestat.children && !filestat.isSymbolicLink) {
      let children = await Promise.all(filestat.children.map((stat) => {
        return this.fileStat2FileTreeItem(stat, result);
      }));
      children = this.sortByNumberic(children);
      Object.assign(result, {
        id: id++,
        uri,
        filestat,
        icon,
        name,
        children,
        parent,
      });
    } else {
      Object.assign(result, {
        id: id++,
        uri,
        filestat,
        icon,
        name,
        parent,
      });
    }
    return result;
  }

  async generatorFile(path: string, parent: IFileTreeItem): Promise<IFileTreeItem> {
    const uri = new URI(path);
    const isDirectory = path.indexOf('.') < 0;
    const result: IFileTreeItem = {
      id: id++,
      uri,
      name: this.labelService.getName(uri),
      icon: await this.labelService.getIcon(uri),
      filestat: {
        isDirectory,
        lastModification: (new Date()).getTime(),
        uri: path,
      },
      parent,
      depth: parent.depth + 1,
      order: 0,
    };
    if (isDirectory) {
      return {
        ...result,
        children: [],
        expanded: false,
      };
    }
    return result;
  }

  sortByNumberic(files: IFileTreeItem[]): IFileTreeItem[] {
    return files.sort((a: IFileTreeItem, b: IFileTreeItem) => {
      if (a.filestat.isDirectory && b.filestat.isDirectory || !a.filestat.isDirectory && !b.filestat.isDirectory) {
        // numeric 参数确保数字为第一排序优先级
        return a.name.localeCompare(b.name, 'kn', { numeric: true });
      } else if (a.filestat.isDirectory && !b.filestat.isDirectory) {
        return -1;
      } else if (!a.filestat.isDirectory && b.filestat.isDirectory) {
        return 1;
      }
      return 1;
    });
  }
}
