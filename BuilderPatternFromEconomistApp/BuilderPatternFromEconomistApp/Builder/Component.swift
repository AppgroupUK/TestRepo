//
//  Component.swift
//  BuilderPatternFromEconomistApp
//
//  Created by Luke Smith on 16/04/2025.
//

import Foundation

// 1.  I declare the Component type.  Dependency will become a concrete type when i pass it in.

open class Component<Dependency> {
    
  public let dependency: Dependency

  public init(dependency: Dependency) {
    self.dependency = dependency
  }
}

// 2.  I declare a protocol for the type Im going to pass in. It contains all the types that the home screen needs.

public protocol HomeScreenDependency {
    var someHomeScreenDependency: String { get }
    var anotherHomeScreenDependency: Int { get }
}

// 3.  I declare the class that conforms to that protocol.  Im subclassing the Component type.  It needs to have the Dependency generic defined in terms of what it will actually be: thats why we add it in angle brackets below as <HomeScreenDependency>.

class SomeHomeScreenDependency: Component<HomeScreenDependency> {
    var someHomeScreenDependency: String = "Hello"
    var anotherHomeScreenDependency: Int = 1
}
