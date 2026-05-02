from setuptools import setup, find_packages

setup(
    name="pulse-sdk",
    version="1.0.0",
    description="Official Python SDK for the Pulse-Ops B2B API",
    author="Pulse-Ops Team",
    packages=find_packages(),
    install_requires=[
        "requests>=2.25.1",
    ],
    python_requires=">=3.8",
)
