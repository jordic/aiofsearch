


from setuptools import setup, find_packages


requirements = open('requirements.txt').read()
readme = open('README.md').read() + '\n'

setup(
    name='aiofilesearch',
    version="0.9.2",
    description='WS Demo for file search',
    long_description=readme,
    author='Jordi Collell',
    author_email='jordic@gmail.com',
    classifiers=[
        'License :: OSI Approved :: BSD License',
        'Intended Audience :: Developers',
        'Topic :: Internet :: WWW/HTTP',
        'Programming Language :: Python :: 3.6',
        'Programming Language :: Python :: 3.7',
        'Environment :: Web Environment'
    ],
    url='https://github.com/jordic/aiofsearch',
    license='BSD',
    zip_safe=True,
    include_package_data=True,
    package_data={'': ['*.txt', '*.rst']},
    packages=find_packages(),
    install_requires=requirements,
    entry_points={
        'console_scripts': [
            'fsearch = tmpo.fsearch.main:run',
        ]
}
)