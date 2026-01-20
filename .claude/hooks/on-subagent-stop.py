#!/usr/bin/env python3
"""
Sub-agent stop hook - Python版本
在sub-agent完成时打印下一步建议命令
"""

import os
import sys
import json
from pathlib import Path


def main():
    # 检查必需的环境变量
    project_dir = os.environ.get('CLAUDE_PROJECT_DIR')
    if not project_dir:
        print('[hook] CLAUDE_PROJECT_DIR not set; skipping')
        sys.exit(0)

    queue_dir = Path(project_dir) / 'enhancements' / 'queue'

    # 检查队列目录
    if not queue_dir.exists():
        print(f'[hook] No queue directory at {queue_dir}; skipping')
        sys.exit(0)

    # 处理单个功能（设置了 SLUG）
    slug = os.environ.get('SLUG')
    if slug:
        queue_file = queue_dir / f'{slug}.json'

        if not queue_file.exists():
            print(f'[hook] ⚠️  Queue file not found: {queue_file}')
            sys.exit(0)

        with open(queue_file, 'r', encoding='utf-8') as f:
            queue = json.load(f)

        status = queue.get('status', 'UNKNOWN')
        title = queue.get('title', '')

        print(f'📍 Current feature: {slug}')
        if title:
            print(f'   Title: {title}')
        print(f'   Status: {status}')
        print()

        # 定义下一步建议
        next_steps = {
            'READY_FOR_ARCH': lambda s=slug: print(f'📐 Next step:\n   Use the architect-review subagent on "{s}".'),
            'READY_FOR_BUILD': lambda s=slug: print(f'🔨 Next step:\n   Use the implementer-tester subagent on "{s}".'),
            'DONE': lambda: print('✅ Feature complete! Ready for PR.'),
            'PENDING': lambda s=slug: print(f'📋 Next step:\n   Use the pm-spec subagent on "{s}".'),
            'ON_HOLD': lambda: print(f'⏸️  Feature is {status}'),
            'BLOCKED': lambda: print(f'⏸️  Feature is {status}')
        }

        action = next_steps.get(status, lambda: print(f'❓ Unknown status: {status}'))
        action()

        sys.exit(0)

    # 显示所有功能
    print('💡 Tip: Set SLUG environment variable to focus on a specific feature')
    print('   Example (Windows): $env:SLUG="feature-a"')
    print('   Example (Unix):    export SLUG=feature-a')
    print()
    print('📋 All features in queue:')
    print()

    categories = {
        'readyBuild': [],
        'readyArch': [],
        'pending': [],
        'done': []
    }

    for file in queue_dir.glob('*.json'):
        slug = file.stem
        with open(file, 'r', encoding='utf-8') as f:
            content = json.load(f)

        status = content.get('status', 'UNKNOWN')
        title = content.get('title', '')

        item = {'slug': slug, 'title': title}

        if status == 'READY_FOR_BUILD':
            categories['readyBuild'].append(item)
        elif status == 'READY_FOR_ARCH':
            categories['readyArch'].append(item)
        elif status == 'PENDING':
            categories['pending'].append(item)
        elif status == 'DONE':
            categories['done'].append(item)

    # 输出分类
    if categories['readyBuild']:
        print('🔨 Ready for implementation:')
        for item in categories['readyBuild']:
            print(f"   {item['slug']} - {item['title']}")
        print()

    if categories['readyArch']:
        print('📐 Ready for architecture review:')
        for item in categories['readyArch']:
            print(f"   {item['slug']} - {item['title']}")
        print()

    if categories['pending']:
        print('📋 Pending (need PM spec):')
        for item in categories['pending']:
            print(f"   {item['slug']} - {item['title']}")
        print()

    if categories['done']:
        print('✅ Completed:')
        for item in categories['done']:
            print(f"   {item['slug']} - {item['title']}")
        print()


if __name__ == '__main__':
    main()
