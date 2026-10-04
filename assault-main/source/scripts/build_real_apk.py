#!/usr/bin/env python3
"""Compatibility entry point: invoke the actual Android build, never synthesize DEX."""
import argparse

if __package__:
    from .build_android import main
else:
    from build_android import main

if __name__ == '__main__':
    argparse.ArgumentParser(description="Build native Assault Manager and its embedded loader.").parse_args()
    main()
